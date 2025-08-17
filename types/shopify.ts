// Shopify-specific type definitions for the Order Printer app

export interface ShopifyOrder {
  id: string
  admin_graphql_api_id: string
  app_id: number | null
  browser_ip: string | null
  buyer_accepts_marketing: boolean
  cancel_reason: string | null
  cancelled_at: string | null
  cart_token: string | null
  checkout_id: number | null
  checkout_token: string | null
  client_details: {
    accept_language: string | null
    browser_height: number | null
    browser_ip: string | null
    browser_width: number | null
    session_hash: string | null
    user_agent: string | null
  } | null
  closed_at: string | null
  confirmed: boolean
  contact_email: string | null
  created_at: string
  currency: string
  current_subtotal_price: string
  current_subtotal_price_set: PriceSet
  current_total_discounts: string
  current_total_discounts_set: PriceSet
  current_total_duties_set: PriceSet | null
  current_total_price: string
  current_total_price_set: PriceSet
  current_total_tax: string
  current_total_tax_set: PriceSet
  customer_locale: string | null
  device_id: number | null
  discount_codes: DiscountCode[]
  email: string
  estimated_taxes: boolean
  financial_status: string
  fulfillment_status: string | null
  gateway: string
  landing_site: string | null
  landing_site_ref: string | null
  location_id: number | null
  name: string
  note: string | null
  note_attributes: NoteAttribute[]
  number: number
  order_number: number
  order_status_url: string
  original_total_duties_set: PriceSet | null
  payment_gateway_names: string[]
  phone: string | null
  presentment_currency: string
  processed_at: string
  processing_method: string
  reference: string | null
  referring_site: string | null
  source_identifier: string | null
  source_name: string
  source_url: string | null
  subtotal_price: string
  subtotal_price_set: PriceSet
  tags: string
  tax_lines: TaxLine[]
  taxes_included: boolean
  test: boolean
  token: string
  total_discounts: string
  total_discounts_set: PriceSet
  total_line_items_price: string
  total_line_items_price_set: PriceSet
  total_outstanding: string
  total_price: string
  total_price_set: PriceSet
  total_price_usd: string
  total_shipping_price_set: PriceSet
  total_tax: string
  total_tax_set: PriceSet
  total_tip_received: string
  total_weight: number
  updated_at: string
  user_id: number | null
  billing_address: Address | null
  customer: Customer | null
  discount_applications: DiscountApplication[]
  fulfillments: Fulfillment[]
  line_items: LineItem[]
  payment_terms: PaymentTerms | null
  refunds: Refund[]
  shipping_address: Address | null
  shipping_lines: ShippingLine[]
}

export interface Customer {
  id: number
  email: string
  accepts_marketing: boolean
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  orders_count: number
  state: string
  total_spent: string
  last_order_id: number | null
  note: string | null
  verified_email: boolean
  multipass_identifier: string | null
  tax_exempt: boolean
  phone: string | null
  tags: string
  last_order_name: string | null
  currency: string
  accepts_marketing_updated_at: string
  marketing_opt_in_level: string | null
  tax_exemptions: string[]
  admin_graphql_api_id: string
  default_address: Address | null
}

export interface Address {
  id?: number
  customer_id?: number
  first_name: string | null
  last_name: string | null
  company: string | null
  address1: string | null
  address2: string | null
  city: string | null
  province: string | null
  country: string | null
  zip: string | null
  phone: string | null
  name: string | null
  province_code: string | null
  country_code: string | null
  country_name: string | null
  default?: boolean
}

export interface LineItem {
  id: number
  admin_graphql_api_id: string
  fulfillable_quantity: number
  fulfillment_service: string
  fulfillment_status: string | null
  gift_card: boolean
  grams: number
  name: string
  origin_location: Location | null
  price: string
  price_set: PriceSet
  product_exists: boolean
  product_id: number | null
  properties: Property[]
  quantity: number
  requires_shipping: boolean
  sku: string | null
  taxable: boolean
  title: string
  total_discount: string
  total_discount_set: PriceSet
  variant_id: number | null
  variant_inventory_management: string | null
  variant_title: string | null
  vendor: string | null
  tax_lines: TaxLine[]
  duties: Duty[]
  discount_allocations: DiscountAllocation[]
}

export interface PriceSet {
  shop_money: Money
  presentment_money: Money
}

export interface Money {
  amount: string
  currency_code: string
}

export interface TaxLine {
  channel_liable: boolean | null
  price: string
  price_set: PriceSet
  rate: number
  title: string
}

export interface Property {
  name: string
  value: string
}

export interface Location {
  id: number
  country_code: string
  province_code: string
  name: string
  address1: string
  address2: string | null
  city: string
  zip: string
}

export interface DiscountCode {
  code: string
  amount: string
  type: string
}

export interface NoteAttribute {
  name: string
  value: string
}

export interface DiscountApplication {
  type: string
  title: string
  description: string | null
  value: string
  value_type: string
  allocation_method: string
  target_selection: string
  target_type: string
}

export interface Fulfillment {
  id: number
  admin_graphql_api_id: string
  created_at: string
  location_id: number | null
  name: string
  order_id: number
  origin_address: Address | null
  receipt: Receipt | null
  service: string
  shipment_status: string | null
  status: string
  tracking_company: string | null
  tracking_number: string | null
  tracking_numbers: string[]
  tracking_url: string | null
  tracking_urls: string[]
  updated_at: string
  line_items: LineItem[]
}

export interface Receipt {
  testcase: boolean
  authorization: string
}

export interface PaymentTerms {
  amount: number
  currency: string
  payment_terms_name: string
  payment_terms_type: string
  due_in_days: number | null
  payment_schedules: PaymentSchedule[]
}

export interface PaymentSchedule {
  amount: number
  currency: string
  issued_at: string | null
  due_at: string | null
  completed_at: string | null
  expected_payment_method: string
}

export interface Refund {
  id: number
  admin_graphql_api_id: string
  created_at: string
  note: string | null
  order_id: number
  processed_at: string
  restock: boolean
  total_duties_set: PriceSet
  user_id: number | null
  order_adjustments: OrderAdjustment[]
  transactions: Transaction[]
  refund_line_items: RefundLineItem[]
  duties: Duty[]
}

export interface OrderAdjustment {
  id: number
  amount: string
  amount_set: PriceSet
  kind: string
  order_id: number
  reason: string
  refund_id: number
  tax_amount: string
  tax_amount_set: PriceSet
}

export interface Transaction {
  id: number
  admin_graphql_api_id: string
  amount: string
  authorization: string | null
  created_at: string
  currency: string
  device_id: number | null
  error_code: string | null
  gateway: string
  kind: string
  location_id: number | null
  message: string | null
  order_id: number
  parent_id: number | null
  processed_at: string
  receipt: Record<string, any>
  source_name: string
  status: string
  test: boolean
  user_id: number | null
}

export interface RefundLineItem {
  id: number
  line_item_id: number
  location_id: number | null
  quantity: number
  restock_type: string
  subtotal: string
  subtotal_set: PriceSet
  total_tax: string
  total_tax_set: PriceSet
  line_item: LineItem
}

export interface Duty {
  id: string
  harmonized_system_code: string | null
  country_code_of_origin: string | null
  shop_money: Money
  presentment_money: Money
  tax_lines: TaxLine[]
  admin_graphql_api_id: string
}

export interface DiscountAllocation {
  amount: string
  amount_set: PriceSet
  discount_application_index: number
}

export interface ShippingLine {
  id: number
  carrier_identifier: string | null
  code: string | null
  delivery_category: string | null
  discounted_price: string
  discounted_price_set: PriceSet
  phone: string | null
  price: string
  price_set: PriceSet
  requested_fulfillment_service_id: string | null
  source: string
  title: string
  tax_lines: TaxLine[]
  discount_allocations: DiscountAllocation[]
}

// App-specific types for GST calculations
export interface GSTBreakdown {
  gstType: 'CGST_SGST' | 'IGST'
  gstRate: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  totalGstAmount: number
  taxableAmount: number
}

export interface OrderWithGST extends ShopifyOrder {
  gstBreakdown: GSTBreakdown
}

// Template types
export interface Template {
  id: string
  name: string
  layout: TemplateLayout
  businessInfo: BusinessInfo
  createdAt: string
  updatedAt: string
}

export interface TemplateLayout {
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  fonts: {
    primary: string
    secondary: string
  }
  colors: {
    primary: string
    secondary: string
    text: string
  }
  logo?: {
    url: string
    width: number
    height: number
  }
}

export interface BusinessInfo {
  companyName: string
  gstin: string
  address: string
  city: string
  state: string
  pincode: string
  phone: string
  email: string
  website?: string
}

// Bulk print types
export interface BulkPrintRequest {
  dateRange: {
    from: string
    to: string
  }
  orderIds: string[]
  format: 'pdf' | 'csv'
  templateId?: string
}

export interface BulkPrintJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  downloadUrl?: string
  error?: string
  createdAt: string
  completedAt?: string
}