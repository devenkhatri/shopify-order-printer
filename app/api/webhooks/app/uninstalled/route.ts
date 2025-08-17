import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/lib/services/webhookService'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let shop: string | undefined

  try {
    const body = await request.text()
    
    // Validate webhook with HMAC verification
    const validation = await WebhookService.validateWebhook(request, body)
    
    if (!validation.isValid) {
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 })
    }

    shop = validation.shop!
    const appData = validation.data
    
    console.log('App uninstalled for shop:', shop)
    
    // Process app uninstallation with retry mechanism
    await WebhookService.processWithRetry(async () => {
      await WebhookService.handleAppUninstalled(appData, shop!)
    })

    const processingTime = Date.now() - startTime
    WebhookService.logWebhookProcessing('app/uninstalled', shop, true, processingTime)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    
    if (shop) {
      WebhookService.logWebhookProcessing('app/uninstalled', shop, false, processingTime, error as Error)
    }
    
    console.error('App uninstall webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}