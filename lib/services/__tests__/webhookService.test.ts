import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { WebhookService } from '../webhookService'
import { shopify } from '@/lib/shopify'
import { sessionStorage } from '@/lib/session'
import { DataCleanupService } from '../dataCleanupService'

// Mock dependencies
vi.mock('@/lib/shopify', () => ({
  shopify: {
    webhooks: {
      validate: vi.fn()
    }
  }
}))

vi.mock('@/lib/session', () => ({
  sessionStorage: {
    findSessionsByShop: vi.fn(),
    deleteSessions: vi.fn()
  }
}))

vi.mock('../dataCleanupService', () => ({
  DataCleanupService: {
    performAppUninstallCleanup: vi.fn(),
    validateCleanup: vi.fn(),
    logCleanupMetrics: vi.fn()
  }
}))

describe('WebhookService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('validateWebhook', () => {
    it('should validate webhook with correct headers and HMAC', async () => {
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            switch (header) {
              case 'x-shopify-topic': return 'orders/create'
              case 'x-shopify-shop-domain': return 'test-shop.myshopify.com'
              case 'x-shopify-hmac-sha256': return 'valid-hmac'
              default: return null
            }
          })
        }
      } as unknown as NextRequest

      const body = JSON.stringify({ id: 123, order_number: 'ORD001' })
      
      vi.mocked(shopify.webhooks.validate).mockResolvedValue(true)

      const result = await WebhookService.validateWebhook(mockRequest, body)

      expect(result.isValid).toBe(true)
      expect(result.shop).toBe('test-shop.myshopify.com')
      expect(result.topic).toBe('orders/create')
      expect(result.data).toEqual({ id: 123, order_number: 'ORD001' })
    })

    it('should reject webhook with missing headers', async () => {
      const mockRequest = {
        headers: {
          get: vi.fn(() => null)
        }
      } as unknown as NextRequest

      const result = await WebhookService.validateWebhook(mockRequest, '{}')

      expect(result.isValid).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Missing required webhook headers')
    })

    it('should reject webhook with invalid HMAC', async () => {
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            switch (header) {
              case 'x-shopify-topic': return 'orders/create'
              case 'x-shopify-shop-domain': return 'test-shop.myshopify.com'
              case 'x-shopify-hmac-sha256': return 'invalid-hmac'
              default: return null
            }
          })
        }
      } as unknown as NextRequest

      vi.mocked(shopify.webhooks.validate).mockResolvedValue(false)

      const result = await WebhookService.validateWebhook(mockRequest, '{}')

      expect(result.isValid).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Webhook HMAC validation failed')
    })

    it('should handle invalid JSON in webhook body', async () => {
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            switch (header) {
              case 'x-shopify-topic': return 'orders/create'
              case 'x-shopify-shop-domain': return 'test-shop.myshopify.com'
              case 'x-shopify-hmac-sha256': return 'valid-hmac'
              default: return null
            }
          })
        }
      } as unknown as NextRequest

      vi.mocked(shopify.webhooks.validate).mockResolvedValue(true)

      const result = await WebhookService.validateWebhook(mockRequest, 'invalid-json')

      expect(result.isValid).toBe(false)
      expect(console.error).toHaveBeenCalledWith('Failed to parse webhook body:', expect.any(Error))
    })
  })

  describe('handleOrderCreated', () => {
    it('should process order creation successfully', async () => {
      const orderData = {
        id: 123,
        order_number: 'ORD001',
        customer: { email: 'test@example.com' },
        total_price: '100.00',
        created_at: '2023-01-01T00:00:00Z'
      }

      await WebhookService.handleOrderCreated(orderData, 'test-shop.myshopify.com')

      expect(console.log).toHaveBeenCalledWith('Processing new order 123 for shop test-shop.myshopify.com')
      expect(console.log).toHaveBeenCalledWith('Order details:', {
        orderId: 123,
        orderNumber: 'ORD001',
        customerEmail: 'test@example.com',
        totalPrice: '100.00',
        createdAt: '2023-01-01T00:00:00Z'
      })
    })

    it('should handle errors in order creation processing', async () => {
      const orderData = null // This will cause an error

      await expect(WebhookService.handleOrderCreated(orderData, 'test-shop.myshopify.com'))
        .rejects.toThrow()

      expect(console.error).toHaveBeenCalledWith('Error handling order created webhook:', expect.any(Error))
    })
  })

  describe('handleOrderUpdated', () => {
    it('should process order update successfully', async () => {
      const orderData = {
        id: 123,
        order_number: 'ORD001',
        financial_status: 'paid',
        fulfillment_status: 'fulfilled',
        updated_at: '2023-01-01T01:00:00Z'
      }

      await WebhookService.handleOrderUpdated(orderData, 'test-shop.myshopify.com')

      expect(console.log).toHaveBeenCalledWith('Processing order update 123 for shop test-shop.myshopify.com')
      expect(console.log).toHaveBeenCalledWith('Order update details:', {
        orderId: 123,
        orderNumber: 'ORD001',
        financialStatus: 'paid',
        fulfillmentStatus: 'fulfilled',
        updatedAt: '2023-01-01T01:00:00Z'
      })
    })
  })

  describe('handleAppUninstalled', () => {
    it('should perform comprehensive cleanup successfully', async () => {
      const mockCleanupResult = {
        success: true,
        sessionsDeleted: 2,
        errors: [],
        cleanupActions: ['Deleted 2 sessions', 'Cleaned up cached data']
      }

      vi.mocked(DataCleanupService.performAppUninstallCleanup).mockResolvedValue(mockCleanupResult)
      vi.mocked(DataCleanupService.validateCleanup).mockResolvedValue(true)

      await WebhookService.handleAppUninstalled({}, 'test-shop.myshopify.com')

      expect(DataCleanupService.performAppUninstallCleanup).toHaveBeenCalledWith('test-shop.myshopify.com')
      expect(DataCleanupService.validateCleanup).toHaveBeenCalledWith('test-shop.myshopify.com')
      expect(DataCleanupService.logCleanupMetrics).toHaveBeenCalledWith(
        'test-shop.myshopify.com',
        mockCleanupResult,
        expect.any(Number)
      )
      expect(console.log).toHaveBeenCalledWith('App uninstallation cleanup completed for shop test-shop.myshopify.com')
    })

    it('should handle cleanup failure', async () => {
      const mockCleanupResult = {
        success: false,
        sessionsDeleted: 0,
        errors: ['Cleanup failed'],
        cleanupActions: []
      }

      vi.mocked(DataCleanupService.performAppUninstallCleanup).mockResolvedValue(mockCleanupResult)

      await expect(WebhookService.handleAppUninstalled({}, 'test-shop.myshopify.com'))
        .rejects.toThrow('Data cleanup failed: Cleanup failed')

      expect(DataCleanupService.logCleanupMetrics).toHaveBeenCalledWith(
        'test-shop.myshopify.com',
        expect.objectContaining({ success: false }),
        expect.any(Number)
      )
    })

    it('should handle validation failure gracefully', async () => {
      const mockCleanupResult = {
        success: true,
        sessionsDeleted: 1,
        errors: [],
        cleanupActions: ['Deleted 1 session']
      }

      vi.mocked(DataCleanupService.performAppUninstallCleanup).mockResolvedValue(mockCleanupResult)
      vi.mocked(DataCleanupService.validateCleanup).mockResolvedValue(false)

      // Should not throw error even if validation fails
      await WebhookService.handleAppUninstalled({}, 'test-shop.myshopify.com')

      expect(console.error).toHaveBeenCalledWith('Cleanup validation failed for shop test-shop.myshopify.com')
      expect(console.log).toHaveBeenCalledWith('App uninstallation cleanup completed for shop test-shop.myshopify.com')
    })
  })

  describe('processWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success')

      const result = await WebhookService.processWithRetry(operation)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success')

      const result = await WebhookService.processWithRetry(operation, 3, 10)

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'))

      await expect(WebhookService.processWithRetry(operation, 2, 10))
        .rejects.toThrow('Persistent failure')

      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('logWebhookProcessing', () => {
    it('should log successful webhook processing', () => {
      WebhookService.logWebhookProcessing('orders/create', 'test-shop.myshopify.com', true, 100)

      expect(console.log).toHaveBeenCalledWith('Webhook processed successfully:', {
        timestamp: expect.any(String),
        topic: 'orders/create',
        shop: 'test-shop.myshopify.com',
        success: true,
        processingTimeMs: 100,
        error: undefined
      })
    })

    it('should log failed webhook processing', () => {
      const error = new Error('Processing failed')
      WebhookService.logWebhookProcessing('orders/create', 'test-shop.myshopify.com', false, 200, error)

      expect(console.error).toHaveBeenCalledWith('Webhook processing failed:', {
        timestamp: expect.any(String),
        topic: 'orders/create',
        shop: 'test-shop.myshopify.com',
        success: false,
        processingTimeMs: 200,
        error: 'Processing failed'
      })
    })
  })
})