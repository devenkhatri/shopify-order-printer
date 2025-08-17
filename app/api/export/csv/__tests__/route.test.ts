import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  getSessionFromRequest: vi.fn().mockResolvedValue({
    shop: 'test-shop.myshopify.com',
    accessToken: 'test-token'
  })
}));

// Mock the order service
vi.mock('@/lib/services/orderService', () => ({
  getOrdersByIds: vi.fn().mockResolvedValue([
    {
      id: '12345',
      name: '#1001',
      created_at: '2024-01-15T10:30:00Z',
      email: 'customer@example.com',
      total_price: '1200.00',
      subtotal_price: '1000.00',
      customer: {
        first_name: 'John',
        last_name: 'Doe'
      },
      line_items: [
        {
          id: 1,
          name: 'Test Product',
          quantity: 1,
          price: '1000.00'
        }
      ]
    }
  ]),
  getOrdersByDateRange: vi.fn().mockResolvedValue([
    {
      id: '12345',
      name: '#1001',
      created_at: '2024-01-15T10:30:00Z',
      email: 'customer@example.com',
      total_price: '1200.00',
      subtotal_price: '1000.00',
      customer: {
        first_name: 'John',
        last_name: 'Doe'
      },
      line_items: [
        {
          id: 1,
          name: 'Test Product',
          quantity: 1,
          price: '1000.00'
        }
      ]
    }
  ])
}));

// Mock the CSV export service
vi.mock('@/lib/services/csvExportService', () => ({
  csvExportService: {
    setStoreState: vi.fn(),
    validateOrdersForExport: vi.fn().mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    }),
    generateCSVFile: vi.fn().mockResolvedValue({
      content: 'Order Number,Customer Name\n#1001,John Doe',
      filename: 'test-export.csv'
    }),
    generateDateRangeCSV: vi.fn().mockResolvedValue({
      content: 'Order Number,Customer Name\n#1001,John Doe',
      filename: 'orders_2024-01-01_to_2024-01-31.csv'
    }),
    generateSummaryCSV: vi.fn().mockResolvedValue({
      content: 'Date,Order Count\n15/1/2024,1',
      filename: 'orders_summary_date_2024-01-15.csv'
    })
  }
}));

describe('/api/export/csv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should export CSV by order IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          orderIds: ['12345'],
          includeGSTBreakdown: true,
          groupByDate: false
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      expect(response.headers.get('Content-Disposition')).toContain('attachment; filename="test-export.csv"');
      
      const content = await response.text();
      expect(content).toBe('Order Number,Customer Name\n#1001,John Doe');
    });

    it('should export CSV by date range', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: {
            from: '2024-01-01',
            to: '2024-01-31'
          },
          includeGSTBreakdown: true,
          groupByDate: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      
      const content = await response.text();
      expect(content).toBe('Order Number,Customer Name\n#1001,John Doe');
    });

    it('should export summary CSV', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          orderIds: ['12345'],
          exportType: 'summary',
          groupBy: 'date',
          includeGSTBreakdown: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      
      const content = await response.text();
      expect(content).toBe('Date,Order Count\n15/1/2024,1');
    });

    it('should return 401 for unauthorized requests', async () => {
      // Mock unauthorized request
      vi.mocked(await import('@/lib/auth')).getSessionFromRequest.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          orderIds: ['12345']
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for missing criteria', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          includeGSTBreakdown: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Either orderIds or dateRange must be provided');
    });

    it('should return 400 for too many orders', async () => {
      const manyOrderIds = Array.from({ length: 1001 }, (_, i) => `order-${i}`);
      
      const request = new NextRequest('http://localhost:3000/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          orderIds: manyOrderIds,
          includeGSTBreakdown: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Maximum 1000 orders allowed per export');
    });

    it('should return 400 for invalid date range', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: {
            from: '2024-01-31',
            to: '2024-01-01' // Invalid: from > to
          },
          includeGSTBreakdown: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid date range: from date must be before to date');
    });
  });

  describe('GET', () => {
    it('should export CSV with query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/csv?orderIds=12345&includeGST=true');

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      
      const content = await response.text();
      expect(content).toBe('Order Number,Customer Name\n#1001,John Doe');
    });

    it('should export CSV with date range parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/csv?dateFrom=2024-01-01&dateTo=2024-01-31&includeGST=true');

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    });

    it('should return 400 for too many orders in GET request', async () => {
      const manyOrderIds = Array.from({ length: 101 }, (_, i) => `order-${i}`).join(',');
      const request = new NextRequest(`http://localhost:3000/api/export/csv?orderIds=${manyOrderIds}`);

      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Maximum 100 orders allowed per GET request. Use POST for larger exports.');
    });

    it('should return 400 for missing parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/export/csv');

      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Either orderIds or date range (dateFrom, dateTo) must be provided');
    });
  });
});