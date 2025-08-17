import { describe, it, expect, beforeEach } from 'vitest';
import { GSTService } from '../gstService';
import { ShopifyOrder, LineItem, Customer, Address } from '../../../types/shopify';

// Mock order data for testing
const mockCustomer: Customer = {
  id: 123,
  email: 'test@example.com',
  accepts_marketing: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  first_name: 'John',
  last_name: 'Doe',
  orders_count: 1,
  state: 'enabled',
  total_spent: '1500.00',
  last_order_id: null,
  note: null,
  verified_email: true,
  multipass_identifier: null,
  tax_exempt: false,
  phone: '+91-9876543210',
  tags: '',
  last_order_name: null,
  currency: 'INR',
  accepts_marketing_updated_at: '2024-01-01T00:00:00Z',
  marketing_opt_in_level: null,
  tax_exemptions: [],
  admin_graphql_api_id: 'gid://shopify/Customer/123',
  default_address: null
};

const mockShippingAddress: Address = {
  id: 456,
  first_name: 'John',
  last_name: 'Doe',
  company: null,
  address1: '123 Test Street',
  address2: null,
  city: 'Mumbai',
  province: 'Maharashtra',
  country: 'India',
  zip: '400001',
  phone: '+91-9876543210',
  name: 'John Doe',
  province_code: 'MH',
  country_code: 'IN',
  country_name: 'India',
  default: false
};

const mockBillingAddress: Address = {
  ...mockShippingAddress,
  id: 457
};

const mockLineItem: LineItem = {
  id: 789,
  admin_graphql_api_id: 'gid://shopify/LineItem/789',
  fulfillable_quantity: 1,
  fulfillment_service: 'manual',
  fulfillment_status: null,
  gift_card: false,
  grams: 200,
  name: 'Cotton T-Shirt - Medium / Blue',
  origin_location: null,
  price: '500.00',
  price_set: {
    shop_money: { amount: '500.00', currency_code: 'INR' },
    presentment_money: { amount: '500.00', currency_code: 'INR' }
  },
  product_exists: true,
  product_id: 101,
  properties: [
    { name: 'Size', value: 'Medium' },
    { name: 'Color', value: 'Blue' },
    { name: 'Material', value: 'Cotton' }
  ],
  quantity: 2,
  requires_shipping: true,
  sku: 'COTTON-TEE-M-BLUE',
  taxable: true,
  title: 'Cotton T-Shirt',
  total_discount: '0.00',
  total_discount_set: {
    shop_money: { amount: '0.00', currency_code: 'INR' },
    presentment_money: { amount: '0.00', currency_code: 'INR' }
  },
  variant_id: 202,
  variant_inventory_management: 'shopify',
  variant_title: 'Medium / Blue',
  vendor: 'Test Store',
  tax_lines: [],
  duties: [],
  discount_allocations: []
};

const createMockOrder = (overrides: Partial<ShopifyOrder> = {}): ShopifyOrder => ({
  id: 'gid://shopify/Order/12345',
  admin_graphql_api_id: 'gid://shopify/Order/12345',
  app_id: null,
  browser_ip: null,
  buyer_accepts_marketing: false,
  cancel_reason: null,
  cancelled_at: null,
  cart_token: null,
  checkout_id: null,
  checkout_token: null,
  client_details: null,
  closed_at: null,
  confirmed: true,
  contact_email: 'test@example.com',
  created_at: '2024-01-15T10:00:00Z',
  currency: 'INR',
  current_subtotal_price: '1000.00',
  current_subtotal_price_set: {
    shop_money: { amount: '1000.00', currency_code: 'INR' },
    presentment_money: { amount: '1000.00', currency_code: 'INR' }
  },
  current_total_discounts: '0.00',
  current_total_discounts_set: {
    shop_money: { amount: '0.00', currency_code: 'INR' },
    presentment_money: { amount: '0.00', currency_code: 'INR' }
  },
  current_total_duties_set: null,
  current_total_price: '1000.00',
  current_total_price_set: {
    shop_money: { amount: '1000.00', currency_code: 'INR' },
    presentment_money: { amount: '1000.00', currency_code: 'INR' }
  },
  current_total_tax: '0.00',
  current_total_tax_set: {
    shop_money: { amount: '0.00', currency_code: 'INR' },
    presentment_money: { amount: '0.00', currency_code: 'INR' }
  },
  customer_locale: null,
  device_id: null,
  discount_codes: [],
  email: 'test@example.com',
  estimated_taxes: false,
  financial_status: 'paid',
  fulfillment_status: null,
  gateway: 'manual',
  landing_site: null,
  landing_site_ref: null,
  location_id: null,
  name: '#1001',
  note: null,
  note_attributes: [],
  number: 1001,
  order_number: 1001,
  order_status_url: '',
  original_total_duties_set: null,
  payment_gateway_names: ['manual'],
  phone: null,
  presentment_currency: 'INR',
  processed_at: '2024-01-15T10:00:00Z',
  processing_method: 'direct',
  reference: null,
  referring_site: null,
  source_identifier: null,
  source_name: 'web',
  source_url: null,
  subtotal_price: '1000.00',
  subtotal_price_set: {
    shop_money: { amount: '1000.00', currency_code: 'INR' },
    presentment_money: { amount: '1000.00', currency_code: 'INR' }
  },
  tags: '',
  tax_lines: [],
  taxes_included: false,
  test: false,
  token: 'test-token',
  total_discounts: '0.00',
  total_discounts_set: {
    shop_money: { amount: '0.00', currency_code: 'INR' },
    presentment_money: { amount: '0.00', currency_code: 'INR' }
  },
  total_line_items_price: '1000.00',
  total_line_items_price_set: {
    shop_money: { amount: '1000.00', currency_code: 'INR' },
    presentment_money: { amount: '1000.00', currency_code: 'INR' }
  },
  total_outstanding: '0.00',
  total_price: '1000.00',
  total_price_set: {
    shop_money: { amount: '1000.00', currency_code: 'INR' },
    presentment_money: { amount: '1000.00', currency_code: 'INR' }
  },
  total_price_usd: '12.00',
  total_shipping_price_set: {
    shop_money: { amount: '0.00', currency_code: 'INR' },
    presentment_money: { amount: '0.00', currency_code: 'INR' }
  },
  total_tax: '0.00',
  total_tax_set: {
    shop_money: { amount: '0.00', currency_code: 'INR' },
    presentment_money: { amount: '0.00', currency_code: 'INR' }
  },
  total_tip_received: '0.00',
  total_weight: 400,
  updated_at: '2024-01-15T10:00:00Z',
  user_id: null,
  billing_address: mockBillingAddress,
  customer: mockCustomer,
  discount_applications: [],
  fulfillments: [],
  line_items: [mockLineItem],
  payment_terms: null,
  refunds: [],
  shipping_address: mockShippingAddress,
  shipping_lines: [],
  ...overrides
});

describe('GSTService', () => {
  let gstService: GSTService;

  beforeEach(() => {
    gstService = new GSTService('KA'); // Karnataka as store state
  });

  describe('Constructor and State Management', () => {
    it('should initialize with default store state', () => {
      const service = new GSTService();
      expect(service.getStoreState()).toBe('MH'); // Default Maharashtra
    });

    it('should initialize with custom store state', () => {
      const service = new GSTService('KA');
      expect(service.getStoreState()).toBe('KA');
    });

    it('should allow setting store state', () => {
      gstService.setStoreState('TN');
      expect(gstService.getStoreState()).toBe('TN');
    });
  });

  describe('extractCustomerState', () => {
    it('should extract state from shipping address province code', () => {
      const order = createMockOrder();
      const state = gstService.extractCustomerState(order);
      expect(state).toBe('MH');
    });

    it('should fallback to billing address if shipping address has no province code', () => {
      const order = createMockOrder({
        shipping_address: { ...mockShippingAddress, province_code: null },
        billing_address: { ...mockBillingAddress, province_code: 'DL' }
      });
      const state = gstService.extractCustomerState(order);
      expect(state).toBe('DL');
    });

    it('should map province name to code if province code is not available', () => {
      const order = createMockOrder({
        shipping_address: { 
          ...mockShippingAddress, 
          province_code: null,
          province: 'Karnataka'
        },
        billing_address: {
          ...mockBillingAddress,
          province_code: null,
          province: 'Karnataka'
        }
      });
      const state = gstService.extractCustomerState(order);
      expect(state).toBe('KA');
    });

    it('should throw error if no state information is available', () => {
      const order = createMockOrder({
        shipping_address: null,
        billing_address: null
      });
      expect(() => gstService.extractCustomerState(order)).toThrow('Unable to determine customer state');
    });
  });

  describe('calculateOrderGST', () => {
    it('should calculate CGST/SGST for same state orders ≥ ₹1000', async () => {
      gstService.setStoreState('MH'); // Same as customer state
      const order = createMockOrder({
        total_price: '1500.00',
        subtotal_price: '1500.00'
      });

      const gstBreakdown = await gstService.calculateOrderGST(order);

      expect(gstBreakdown.gstType).toBe('CGST_SGST');
      expect(gstBreakdown.gstRate).toBe(0.12);
      expect(gstBreakdown.taxableAmount).toBe(1500);
      expect(gstBreakdown.totalGstAmount).toBe(180);
      expect(gstBreakdown.cgstAmount).toBe(90);
      expect(gstBreakdown.sgstAmount).toBe(90);
    });

    it('should calculate IGST for different state orders ≥ ₹1000', async () => {
      gstService.setStoreState('KA'); // Different from customer state (MH)
      const order = createMockOrder({
        total_price: '1500.00',
        subtotal_price: '1500.00'
      });

      const gstBreakdown = await gstService.calculateOrderGST(order);

      expect(gstBreakdown.gstType).toBe('IGST');
      expect(gstBreakdown.gstRate).toBe(0.12);
      expect(gstBreakdown.taxableAmount).toBe(1500);
      expect(gstBreakdown.totalGstAmount).toBe(180);
      expect(gstBreakdown.igstAmount).toBe(180);
    });

    it('should calculate 5% GST for orders < ₹1000', async () => {
      const order = createMockOrder({
        total_price: '800.00',
        subtotal_price: '800.00'
      });

      const gstBreakdown = await gstService.calculateOrderGST(order);

      expect(gstBreakdown.gstRate).toBe(0.05);
      expect(gstBreakdown.totalGstAmount).toBe(40);
    });

    it('should include HSN code in breakdown', async () => {
      const order = createMockOrder();
      const gstBreakdown = await gstService.calculateOrderGST(order);
      expect(gstBreakdown.hsnCode).toBeDefined();
    });
  });

  describe('calculateLineItemGST', () => {
    it('should calculate GST for individual line items', async () => {
      const order = createMockOrder({
        line_items: [
          { ...mockLineItem, price: '600.00', quantity: 1 },
          { ...mockLineItem, id: 790, price: '400.00', quantity: 1, title: 'Polyester T-Shirt' }
        ]
      });

      const result = await gstService.calculateLineItemGST(order);

      expect(result.lineItems).toHaveLength(2);
      expect(result.lineItems[0].gstBreakdown.taxableAmount).toBe(600);
      expect(result.lineItems[1].gstBreakdown.taxableAmount).toBe(400);
      expect(result.orderTotal.taxableAmount).toBe(1000);
    });

    it('should include T-shirt details for each line item', async () => {
      const order = createMockOrder();
      const result = await gstService.calculateLineItemGST(order);

      expect(result.lineItems[0].tshirtDetails).toBeDefined();
      expect(result.lineItems[0].tshirtDetails.size).toBe('Medium');
      expect(result.lineItems[0].tshirtDetails.color).toBe('Blue');
      expect(result.lineItems[0].tshirtDetails.material).toBe('Cotton');
    });
  });

  describe('addGSTToOrder', () => {
    it('should add GST breakdown to order object', async () => {
      const order = createMockOrder();
      const orderWithGST = await gstService.addGSTToOrder(order);

      expect(orderWithGST.gstBreakdown).toBeDefined();
      expect(orderWithGST.gstBreakdown.gstType).toBe('IGST'); // KA store, MH customer
      expect(orderWithGST.id).toBe(order.id);
    });
  });

  describe('addGSTToOrders', () => {
    it('should add GST breakdown to multiple orders', async () => {
      const orders = [
        createMockOrder({ id: 'order1' }),
        createMockOrder({ id: 'order2', total_price: '800.00', subtotal_price: '800.00' })
      ];

      const ordersWithGST = await gstService.addGSTToOrders(orders);

      expect(ordersWithGST).toHaveLength(2);
      expect(ordersWithGST[0].gstBreakdown.gstRate).toBe(0.12); // ≥ ₹1000
      expect(ordersWithGST[1].gstBreakdown.gstRate).toBe(0.05); // < ₹1000
    });

    it('should handle errors gracefully and provide fallback GST breakdown', async () => {
      const orders = [
        createMockOrder(),
        createMockOrder({ 
          id: 'invalid-order',
          shipping_address: null,
          billing_address: null
        })
      ];

      const ordersWithGST = await gstService.addGSTToOrders(orders);

      expect(ordersWithGST).toHaveLength(2);
      expect(ordersWithGST[0].gstBreakdown.gstRate).toBe(0.12);
      expect(ordersWithGST[1].gstBreakdown.gstRate).toBe(0); // Fallback
    });
  });

  describe('createGSTSummary', () => {
    it('should create comprehensive GST summary for multiple orders', async () => {
      const orders = [
        createMockOrder({ 
          id: 'order1',
          total_price: '1500.00',
          subtotal_price: '1500.00'
        }),
        createMockOrder({ 
          id: 'order2',
          total_price: '800.00',
          subtotal_price: '800.00',
          shipping_address: { ...mockShippingAddress, province_code: 'KA' } // Same state as store
        })
      ];

      const summary = await gstService.createGSTSummary(orders);

      expect(summary.totalOrders).toBe(2);
      expect(summary.totalTaxableAmount).toBe(2300);
      expect(summary.totalGSTAmount).toBe(220); // 180 (12% of 1500) + 40 (5% of 800)
      expect(summary.totalIGSTAmount).toBe(180); // Different state order
      expect(summary.totalCGSTAmount).toBe(20); // Same state order (half of 40)
      expect(summary.totalSGSTAmount).toBe(20); // Same state order (half of 40)
      expect(summary.stateWiseBreakdown['MH']).toBeDefined();
      expect(summary.stateWiseBreakdown['KA']).toBeDefined();
    });
  });

  describe('validateOrderForGST', () => {
    it('should validate valid order', () => {
      const order = createMockOrder();
      const validation = gstService.validateOrderForGST(order);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject order with invalid total', () => {
      const order = createMockOrder({ total_price: '0' });
      const validation = gstService.validateOrderForGST(order);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Order total must be greater than 0');
    });

    it('should reject order without line items', () => {
      const order = createMockOrder({ line_items: [] });
      const validation = gstService.validateOrderForGST(order);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Order must have at least one line item');
    });

    it('should reject order without state information', () => {
      const order = createMockOrder({
        shipping_address: null,
        billing_address: null
      });
      const validation = gstService.validateOrderForGST(order);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Unable to determine customer state'))).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    it('should get correct GST rate for order total', () => {
      const lowOrder = createMockOrder({ total_price: '800.00' });
      const highOrder = createMockOrder({ total_price: '1500.00' });

      expect(gstService.getGSTRateForOrder(lowOrder)).toBe(0.05);
      expect(gstService.getGSTRateForOrder(highOrder)).toBe(0.12);
    });

    it('should identify GST exempt orders', () => {
      const exemptOrder = createMockOrder({
        customer: { ...mockCustomer, tax_exempt: true }
      });
      const nonExemptOrder = createMockOrder();

      expect(gstService.isOrderGSTExempt(exemptOrder)).toBe(true);
      expect(gstService.isOrderGSTExempt(nonExemptOrder)).toBe(false);
    });

    it('should identify orders with non-taxable items', () => {
      const orderWithNonTaxableItem = createMockOrder({
        line_items: [{ ...mockLineItem, taxable: false }]
      });

      expect(gstService.isOrderGSTExempt(orderWithNonTaxableItem)).toBe(true);
    });
  });
});