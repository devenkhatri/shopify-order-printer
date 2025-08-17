import { NextRequest, NextResponse } from 'next/server'
import { shopify } from '@/lib/shopify'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const topic = request.headers.get('x-shopify-topic')
    const shop = request.headers.get('x-shopify-shop-domain')
    const hmac = request.headers.get('x-shopify-hmac-sha256')

    // Verify webhook authenticity
    const isValid = await shopify.webhooks.validate({
      rawBody: body,
      rawRequest: request,
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 })
    }

    const orderData = JSON.parse(body)

    switch (topic) {
      case 'orders/create':
        console.log('New order created:', orderData.id)
        // Handle new order logic here
        break
      case 'orders/updated':
        console.log('Order updated:', orderData.id)
        // Handle order update logic here
        break
      case 'orders/paid':
        console.log('Order paid:', orderData.id)
        // Handle order payment logic here
        break
      default:
        console.log('Unhandled webhook topic:', topic)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}