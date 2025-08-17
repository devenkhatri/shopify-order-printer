import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WebhookMonitoringService } from '../webhookMonitoringService'

describe('WebhookMonitoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Clear metrics before each test
    WebhookMonitoringService.clearMetrics()
  })

  describe('recordWebhookMetrics', () => {
    it('should record successful webhook metrics', () => {
      WebhookMonitoringService.recordWebhookMetrics(
        'test-shop.myshopify.com',
        'orders/create',
        true,
        150
      )

      const metrics = WebhookMonitoringService.getAllMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0]).toMatchObject({
        shop: 'test-shop.myshopify.com',
        topic: 'orders/create',
        success: true,
        processingTimeMs: 150
      })

      expect(console.log).toHaveBeenCalledWith('Webhook processed successfully:', {
        shop: 'test-shop.myshopify.com',
        topic: 'orders/create',
        processingTimeMs: 150,
        retryCount: undefined
      })
    })

    it('should record failed webhook metrics', () => {
      const error = new Error('Processing failed')
      
      WebhookMonitoringService.recordWebhookMetrics(
        'test-shop.myshopify.com',
        'orders/create',
        false,
        200,
        error,
        2
      )

      const metrics = WebhookMonitoringService.getAllMetrics()
      expect(metrics).toHaveLength(1)
      expect(metrics[0]).toMatchObject({
        shop: 'test-shop.myshopify.com',
        topic: 'orders/create',
        success: false,
        processingTimeMs: 200,
        error: 'Processing failed',
        retryCount: 2
      })

      expect(console.error).toHaveBeenCalledWith('Webhook processing failed:', {
        shop: 'test-shop.myshopify.com',
        topic: 'orders/create',
        processingTimeMs: 200,
        error: 'Processing failed',
        retryCount: 2
      })
    })

    it('should limit metrics history', () => {
      // Record more than MAX_METRICS_HISTORY (1000) metrics
      for (let i = 0; i < 1005; i++) {
        WebhookMonitoringService.recordWebhookMetrics(
          'test-shop.myshopify.com',
          'orders/create',
          true,
          100
        )
      }

      const metrics = WebhookMonitoringService.getAllMetrics()
      expect(metrics).toHaveLength(1000)
    })
  })

  describe('getWebhookHealthStatus', () => {
    it('should return empty status when no metrics exist', () => {
      const status = WebhookMonitoringService.getWebhookHealthStatus()
      
      expect(status).toEqual({
        totalWebhooks: 0,
        successfulWebhooks: 0,
        failedWebhooks: 0,
        averageProcessingTime: 0,
        errorRate: 0
      })
    })

    it('should calculate health status correctly', () => {
      // Record some successful and failed webhooks
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', true, 100)
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', true, 200)
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', false, 300)
      WebhookMonitoringService.recordWebhookMetrics('shop2', 'orders/create', true, 150)

      const status = WebhookMonitoringService.getWebhookHealthStatus()
      
      expect(status.totalWebhooks).toBe(4)
      expect(status.successfulWebhooks).toBe(3)
      expect(status.failedWebhooks).toBe(1)
      expect(status.averageProcessingTime).toBe(188) // (100+200+300+150)/4 = 187.5, rounded to 188
      expect(status.errorRate).toBe(25) // 1/4 = 25%
      expect(status.lastProcessedAt).toBeDefined()
    })

    it('should filter by shop when specified', () => {
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', true, 100)
      WebhookMonitoringService.recordWebhookMetrics('shop2', 'orders/create', false, 200)

      const shop1Status = WebhookMonitoringService.getWebhookHealthStatus('shop1')
      
      expect(shop1Status.totalWebhooks).toBe(1)
      expect(shop1Status.successfulWebhooks).toBe(1)
      expect(shop1Status.errorRate).toBe(0)
    })
  })

  describe('getRecentFailures', () => {
    it('should return recent failures in chronological order', async () => {
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', true, 100)
      
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1))
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', false, 200, new Error('Error 1'))
      
      await new Promise(resolve => setTimeout(resolve, 1))
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', false, 300, new Error('Error 2'))

      const failures = WebhookMonitoringService.getRecentFailures()
      
      expect(failures).toHaveLength(2)
      expect(failures[0].error).toBe('Error 2') // Most recent first
      expect(failures[1].error).toBe('Error 1')
    })

    it('should limit results to specified limit', () => {
      for (let i = 0; i < 5; i++) {
        WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', false, 100, new Error(`Error ${i}`))
      }

      const failures = WebhookMonitoringService.getRecentFailures(undefined, 3)
      expect(failures).toHaveLength(3)
    })
  })

  describe('getStatsByTopic', () => {
    it('should group statistics by topic', () => {
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', true, 100)
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', false, 200)
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'app/uninstalled', true, 150)

      const stats = WebhookMonitoringService.getStatsByTopic()
      
      expect(Object.keys(stats)).toEqual(['orders/create', 'app/uninstalled'])
      expect(stats['orders/create'].totalWebhooks).toBe(2)
      expect(stats['orders/create'].errorRate).toBe(50)
      expect(stats['app/uninstalled'].totalWebhooks).toBe(1)
      expect(stats['app/uninstalled'].errorRate).toBe(0)
    })
  })

  describe('isWebhookHealthy', () => {
    it('should return true for healthy webhooks', () => {
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', true, 100)
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', true, 200)

      const isHealthy = WebhookMonitoringService.isWebhookHealthy()
      expect(isHealthy).toBe(true)
    })

    it('should return false for unhealthy webhooks', () => {
      // Create high error rate (above 10% threshold)
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', false, 100)
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', false, 200)

      const isHealthy = WebhookMonitoringService.isWebhookHealthy()
      expect(isHealthy).toBe(false)
    })

    it('should return true when no webhooks exist', () => {
      const isHealthy = WebhookMonitoringService.isWebhookHealthy()
      expect(isHealthy).toBe(true)
    })
  })

  describe('generateHealthReport', () => {
    it('should generate a comprehensive health report', () => {
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', true, 100)
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', false, 200, new Error('Test error'))

      const report = WebhookMonitoringService.generateHealthReport()
      
      expect(report).toContain('Webhook Health Report')
      expect(report).toContain('Total Webhooks: 2')
      expect(report).toContain('Success Rate: 50%')
      expect(report).toContain('orders/create')
      expect(report).toContain('Recent Failures')
      expect(report).toContain('Test error')
    })

    it('should generate shop-specific report', () => {
      WebhookMonitoringService.recordWebhookMetrics('shop1', 'orders/create', true, 100)
      WebhookMonitoringService.recordWebhookMetrics('shop2', 'orders/create', true, 200)

      const report = WebhookMonitoringService.generateHealthReport('shop1')
      
      expect(report).toContain('for shop1')
      expect(report).toContain('Total Webhooks: 1')
    })
  })
})