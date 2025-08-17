import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/lib/services/webhookService'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let topic: string | undefined
  let shop: string | undefined

  try {
    const body = await request.text()
    
    // Validate webhook with HMAC verification
    const validation = await WebhookService.validateWebhook(request, body)
    
    if (!validation.isValid) {
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 })
    }

    topic = validation.topic!
    shop = validation.shop!
    const orderData = validation.data

    // Process webhook with retry mechanism
    await WebhookService.processWithRetry(async () => {
      switch (topic) {
        case 'orders/create':
          await WebhookService.handleOrderCreated(orderData, shop!)
          break
          
        case 'orders/updated':
          await WebhookService.handleOrderUpdated(orderData, shop!)
          break
          
        case 'orders/paid':
          console.log('Order paid:', orderData.id)
          // Handle order payment logic here if needed
          // For now, we'll just log it as the main focus is create/update
          break
          
        default:
          console.log('Unhandled webhook topic:', topic)
      }
    })

    const processingTime = Date.now() - startTime
    WebhookService.logWebhookProcessing(topic, shop, true, processingTime)

    return NextResponse.json({ success: true })
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    if (topic && shop) {
      WebhookService.logWebhookProcessing(topic, shop, false, processingTime, error as Error)
    }
    
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}