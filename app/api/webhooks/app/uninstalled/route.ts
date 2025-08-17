import { NextRequest, NextResponse } from 'next/server'
import { shopify } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const shop = request.headers.get('x-shopify-shop-domain')
    const hmac = request.headers.get('x-shopify-hmac-sha256')

    // Verify webhook authenticity
    const isValid = await shopify.webhooks.verify({
      rawBody: body,
      rawRequest: request,
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 })
    }

    const appData = JSON.parse(body)
    
    console.log('App uninstalled for shop:', shop)
    
    // Clean up app data according to Shopify policies
    // This should include:
    // - Removing stored session data
    // - Cleaning up any cached order data
    // - Removing app-specific metafields if necessary
    
    // TODO: Implement data cleanup logic
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('App uninstall webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}