import { shopifyApi } from '@shopify/shopify-api'
import { restResources } from '@shopify/shopify-api/rest/admin/2024-07'

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: [
    'read_orders',
    'read_customers', 
    'read_products',
    'read_product_listings',
    'read_inventory',
    'read_locations',
    'read_shipping',
    'read_analytics',
    'read_reports',
    'write_files',
    'read_content',
    'write_content'
  ],
  hostName: process.env.SHOPIFY_APP_URL!.replace(/https?:\/\//, ''),
  hostScheme: 'https',
  apiVersion: '2024-07',
  isEmbeddedApp: true,
  restResources,
})