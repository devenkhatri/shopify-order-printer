import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DataCleanupService } from '../dataCleanupService'
import { sessionStorage } from '@/lib/session'

// Mock dependencies
vi.mock('@/lib/session', () => ({
  sessionStorage: {
    deleteAllSessionsForShop: vi.fn(),
    findSessionsByShop: vi.fn()
  }
}))

describe('DataCleanupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('performAppUninstallCleanup', () => {
    it('should perform complete cleanup successfully', async () => {
      vi.mocked(sessionStorage.deleteAllSessionsForShop).mockResolvedValue(3)

      const result = await DataCleanupService.performAppUninstallCleanup('test-shop.myshopify.com')

      expect(result.success).toBe(true)
      expect(result.sessionsDeleted).toBe(3)
      expect(result.errors).toHaveLength(0)
      expect(result.cleanupActions).toEqual([
        'Deleted 3 sessions',
        'Cleaned up cached order data',
        'Cleaned up stored templates',
        'Cleaned up print job data'
      ])

      expect(sessionStorage.deleteAllSessionsForShop).toHaveBeenCalledWith('test-shop.myshopify.com')
      expect(console.log).toHaveBeenCalledWith(
        'Data cleanup completed for shop test-shop.myshopify.com:',
        expect.any(Array)
      )
    })

    it('should handle cleanup failure gracefully', async () => {
      const error = new Error('Session cleanup failed')
      vi.mocked(sessionStorage.deleteAllSessionsForShop).mockRejectedValue(error)

      const result = await DataCleanupService.performAppUninstallCleanup('test-shop.myshopify.com')

      expect(result.success).toBe(false)
      expect(result.errors).toContain('Session cleanup failed')
      expect(console.error).toHaveBeenCalledWith(
        'Data cleanup failed for shop test-shop.myshopify.com:',
        error
      )
    })

    it('should handle zero sessions to delete', async () => {
      vi.mocked(sessionStorage.deleteAllSessionsForShop).mockResolvedValue(0)

      const result = await DataCleanupService.performAppUninstallCleanup('test-shop.myshopify.com')

      expect(result.success).toBe(true)
      expect(result.sessionsDeleted).toBe(0)
      expect(result.cleanupActions).toContain('Deleted 0 sessions')
    })
  })

  describe('validateCleanup', () => {
    it('should validate successful cleanup', async () => {
      vi.mocked(sessionStorage.findSessionsByShop).mockResolvedValue([])

      const isValid = await DataCleanupService.validateCleanup('test-shop.myshopify.com')

      expect(isValid).toBe(true)
      expect(sessionStorage.findSessionsByShop).toHaveBeenCalledWith('test-shop.myshopify.com')
      expect(console.log).toHaveBeenCalledWith('Cleanup validation passed for shop test-shop.myshopify.com')
    })

    it('should detect incomplete cleanup', async () => {
      const remainingSessions = [
        { id: 'session1', shop: 'test-shop.myshopify.com' }
      ]
      vi.mocked(sessionStorage.findSessionsByShop).mockResolvedValue(remainingSessions as any)

      const isValid = await DataCleanupService.validateCleanup('test-shop.myshopify.com')

      expect(isValid).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'Cleanup validation failed: 1 sessions still exist for shop test-shop.myshopify.com'
      )
    })

    it('should handle validation errors', async () => {
      const error = new Error('Validation failed')
      vi.mocked(sessionStorage.findSessionsByShop).mockRejectedValue(error)

      const isValid = await DataCleanupService.validateCleanup('test-shop.myshopify.com')

      expect(isValid).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'Cleanup validation failed for shop test-shop.myshopify.com:',
        error
      )
    })
  })

  describe('logCleanupMetrics', () => {
    it('should log successful cleanup metrics', () => {
      const result = {
        success: true,
        sessionsDeleted: 5,
        errors: [],
        cleanupActions: ['action1', 'action2', 'action3']
      }

      DataCleanupService.logCleanupMetrics('test-shop.myshopify.com', result, 150)

      expect(console.log).toHaveBeenCalledWith('App uninstall cleanup metrics:', {
        timestamp: expect.any(String),
        shop: 'test-shop.myshopify.com',
        success: true,
        sessionsDeleted: 5,
        cleanupActions: 3,
        errors: 0,
        processingTimeMs: 150
      })
    })

    it('should log failed cleanup metrics', () => {
      const result = {
        success: false,
        sessionsDeleted: 2,
        errors: ['Error 1', 'Error 2'],
        cleanupActions: ['action1']
      }

      DataCleanupService.logCleanupMetrics('test-shop.myshopify.com', result, 200)

      expect(console.error).toHaveBeenCalledWith('App uninstall cleanup failed:', {
        timestamp: expect.any(String),
        shop: 'test-shop.myshopify.com',
        success: false,
        sessionsDeleted: 2,
        cleanupActions: 1,
        errors: 2,
        processingTimeMs: 200
      }, { errors: ['Error 1', 'Error 2'] })
    })
  })
})