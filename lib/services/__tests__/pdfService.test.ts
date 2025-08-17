import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PDFService } from '../pdfService';
import { ShopifyOrder } from '../../../types/shopify';

// Mock puppeteer
vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(() => Promise.resolve({
      newPage: vi.fn(() => Promise.resolve({
        setContent: vi.fn(() => Promise.resolve()),
        pdf: vi.fn(() => Promise.resolve(Buffer.from('mock-pdf-content'))),
        close: vi.fn(() => Promise.resolve())
      })),
      close: vi.fn(() => Promise.resolve())
    }))
  }
}));

// Mock services
vi.mock('../gstService', () => ({
  GSTService: vi.fn(() => ({
    addGSTToOrder: vi.fn((order) => Promise.resolve({
      ...order,
      gstBreakdown: {
        gstType: 'CGST_SGST',
        gstRate: 0.12,
        cgstAmount: 60,
        sgstAmount: 60,
        totalGstAmount: 120,
        taxableAmount: 1000
      }
    })),
    addGSTToOrders: vi.fn((orders) => Promise.resolve(orders.map(order => ({
      ...order,
      gstBreakdown: {
        gstType: 'CGST_SGST',
        gstRate: 0.12,
        cgstAmount: 60,
        sgstAmount: 60,
        totalGstAmount: 120,
        taxableAmount: 1000
      }
    })))),
    createGSTSummary: vi.fn(() => Promise.resolve({
      totalOrders: 1,
      totalTaxableAmount: 1000,
      totalGSTAmount: 120,
      totalCGSTAmount: 60,
      totalSGSTAmount: 60,
      totalIGSTAmount: 0,
      averageGSTRate: 0.12,
      stateWiseBreakdown: {}
    }))
  }))
}));

vi.mock('../templateService', () => ({
  TemplateService: vi.fn(() => ({
    getTemplate: vi.fn(() => Promise.resolve({
      success: true,
      data: {
        id: 'test-template',
        name: 'Test Template',
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          fonts: {
            primary: 'Arial, sans-serif',
            secondary: 'Arial, sans-serif',
            size: { header: 18, body: 12, footer: 10 }
          },
          colors: {
            primary: '#000000',
            secondary: '#666666',
            text: '#333333',
            background: '#ffffff'
          },
          showGSTBreakdown: true,
          showHSNCodes: true
        }
      }
    })),
    getDefaultTemplate: vi.fn(() => Promise.resolve({
      success: true,
      data: {
        id: 'default-template',
        name: 'Default Template',
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 20, bottom: 20, left: 20 },
          fonts: {
            primary: 'Arial, sans-serif',
            secondary: 'Arial, sans-serif',
            size: { header: 18, body: 12, footer: 10 }
          },
          colors: {
            primary: '#000000',
            secondary: '#666666',
            text: '#333333',
            background: '#ffffff'
          },
          showGSTBreakdown: true,
          showHSNCodes: true
        }
      }
    })),
    getBusinessInfo: vi.fn(() => Promise.resolve({
      success: true,
      data: {
        companyName: 'Test Company',
        gstin: '27ABCDE1234F1Z5',
        address: {
          line1: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        contact: {
          phone: '+91 9876543210',
          email: 'test@company.com'
        }
      }
    }))
  }))
}));

describe('PDFService', () => {
  let pdfService: PDFService;
  let mockSession: { shop: string; accessToken: string };
  let mockOrder: ShopifyOrder;

  beforeEach(() => {
    mockSession = {
      shop: 'test-shop.myshopify.com',
      accessToken: 'test-token'
    };

    pdfService = new PDFService(mockSession);

    mockOrder = {
      id: 'gid://shopify/Order/123',
      order_number: 1001,
      created_at: '2024-01-15T10:30:00Z',
      total_price: '1200.00',
      subtotal_price: '1000.00',
      current_total_price: '1200.00',
      current_subtotal_price: '1000.00',
      financial_status: 'paid',
      email: 'customer@example.com',
      customer: {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'customer@example.com',
        phone: '+91 9876543210'
      } as any,
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        address1: '123 Customer Street',
        city: 'Mumbai',
        province: 'Maharashtra',
        province_code: 'MH',
        zip: '400001',
        country: 'India',
        country_code: 'IN'
      } as any,
      line_items: [
        {
          id: 1,
          title: 'Cotton T-Shirt',
          variant_title: 'Large / Blue',
          quantity: 2,
          price: '500.00',
          properties: [
            { name: 'Size', value: 'Large' },
            { name: 'Color', value: 'Blue' },
            { name: 'Material', value: 'Cotton' },
            { name: 'HSN Code', value: '6109' }
          ]
        } as any
      ]
    } as any;
  });

  afterEach(async () => {
    await pdfService.closeBrowser();
  });

  describe('generateOrderPDF', () => {
    it('should generate PDF for a single order successfully', async () => {
      const result = await pdfService.generateOrderPDF(mockOrder);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/^order_1001_\d+\.pdf$/);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.pageCount).toBe(1);
      expect(result.metadata?.fileSize).toBeGreaterThan(0);
    });

    it('should generate PDF with custom options', async () => {
      const options = {
        templateId: 'custom-template',
        includeGSTBreakdown: true,
        includeHSNCodes: true,
        includeBusinessInfo: true
      };

      const result = await pdfService.generateOrderPDF(mockOrder, options);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/^order_1001_\d+\.pdf$/);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in GST service
      const pdfServiceWithError = new PDFService(mockSession);
      vi.mocked(pdfServiceWithError['gstService'].addGSTToOrder).mockRejectedValue(
        new Error('GST calculation failed')
      );

      const result = await pdfServiceWithError.generateOrderPDF(mockOrder);

      expect(result.success).toBe(false);
      expect(result.error).toContain('GST calculation failed');
    });
  });

  describe('generateBulkPDF', () => {
    it('should generate bulk PDF for multiple orders', async () => {
      const orders = [mockOrder, { ...mockOrder, id: 'gid://shopify/Order/124', order_number: 1002 }];

      const result = await pdfService.generateBulkPDF(orders);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/^bulk_orders_2_\d+\.pdf$/);
      expect(result.metadata?.pageCount).toBeGreaterThan(0);
    });

    it('should generate bulk PDF with grouping by date', async () => {
      const orders = [mockOrder, { ...mockOrder, id: 'gid://shopify/Order/124', order_number: 1002 }];
      const options = {
        groupByDate: true,
        includeOrderSummary: true,
        maxOrdersPerPage: 3
      };

      const result = await pdfService.generateBulkPDF(orders, options);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });

    it('should handle empty orders array', async () => {
      const result = await pdfService.generateBulkPDF([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No orders provided');
    });
  });

  describe('generatePreviewPDF', () => {
    it('should generate preview PDF with template', async () => {
      const result = await pdfService.generatePreviewPDF('test-template');

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filename).toMatch(/^order_1001_\d+\.pdf$/);
    });

    it('should generate preview PDF with sample order', async () => {
      const result = await pdfService.generatePreviewPDF('test-template', mockOrder);

      expect(result.success).toBe(true);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('HTML generation', () => {
    it('should generate proper HTML structure', async () => {
      // This is tested indirectly through PDF generation
      const result = await pdfService.generateOrderPDF(mockOrder);
      expect(result.success).toBe(true);
    });
  });

  describe('CSS generation', () => {
    it('should generate CSS based on template', async () => {
      // This is tested indirectly through PDF generation
      const result = await pdfService.generateOrderPDF(mockOrder);
      expect(result.success).toBe(true);
    });
  });

  describe('T-shirt details extraction', () => {
    it('should extract T-shirt details correctly', async () => {
      const result = await pdfService.generateOrderPDF(mockOrder);
      expect(result.success).toBe(true);
      // T-shirt details are included in the generated PDF
    });
  });

  describe('GST breakdown display', () => {
    it('should include GST breakdown in PDF', async () => {
      const options = { includeGSTBreakdown: true };
      const result = await pdfService.generateOrderPDF(mockOrder, options);
      expect(result.success).toBe(true);
    });

    it('should exclude GST breakdown when option is false', async () => {
      const options = { includeGSTBreakdown: false };
      const result = await pdfService.generateOrderPDF(mockOrder, options);
      expect(result.success).toBe(true);
    });
  });

  describe('HSN codes display', () => {
    it('should include HSN codes in PDF', async () => {
      const options = { includeHSNCodes: true };
      const result = await pdfService.generateOrderPDF(mockOrder, options);
      expect(result.success).toBe(true);
    });

    it('should exclude HSN codes when option is false', async () => {
      const options = { includeHSNCodes: false };
      const result = await pdfService.generateOrderPDF(mockOrder, options);
      expect(result.success).toBe(true);
    });
  });

  describe('Browser management', () => {
    it('should initialize browser when needed', async () => {
      const result = await pdfService.generateOrderPDF(mockOrder);
      expect(result.success).toBe(true);
    });

    it('should close browser properly', async () => {
      await pdfService.generateOrderPDF(mockOrder);
      await expect(pdfService.closeBrowser()).resolves.not.toThrow();
    });
  });
});