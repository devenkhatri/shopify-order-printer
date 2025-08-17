import { NextRequest, NextResponse } from 'next/server'
import { WebhookMonitoringService } from '@/lib/services/webhookMonitoringService'
import { healthCheckHandler, monitor } from '@/lib/monitoring/production'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    const format = searchParams.get('format') || 'json'
    const type = searchParams.get('type') || 'webhook'

    // Production health check for load balancers and monitoring
    if (type === 'system') {
      return await healthCheckHandler()
    }

    if (format === 'report') {
      // Return a human-readable health report
      const report = WebhookMonitoringService.generateHealthReport(shop || undefined)
      
      return new NextResponse(report, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }

    // Return JSON health data
    const healthStatus = WebhookMonitoringService.getWebhookHealthStatus(shop || undefined)
    const statsByTopic = WebhookMonitoringService.getStatsByTopic(shop || undefined)
    const recentFailures = WebhookMonitoringService.getRecentFailures(shop || undefined, 10)
    const isHealthy = WebhookMonitoringService.isWebhookHealthy(shop || undefined)

    // Get system health for comprehensive monitoring
    const systemHealth = await monitor.performHealthCheck()

    return NextResponse.json({
      shop: shop || 'all',
      healthy: isHealthy && systemHealth.status === 'healthy',
      webhook: {
        healthy: isHealthy,
        overall: healthStatus,
        byTopic: statsByTopic,
        recentFailures
      },
      system: systemHealth
    })

  } catch (error) {
    monitor.logError(error as Error, { endpoint: '/api/webhooks/health', shop })
    return NextResponse.json(
      { error: 'Failed to get health status' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear metrics (useful for testing or resetting monitoring data)
    WebhookMonitoringService.clearMetrics()
    
    return NextResponse.json({ success: true, message: 'Webhook metrics cleared' })
  } catch (error) {
    console.error('Error clearing webhook metrics:', error)
    return NextResponse.json(
      { error: 'Failed to clear webhook metrics' },
      { status: 500 }
    )
  }
}