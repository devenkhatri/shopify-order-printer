import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT } from '../route'

// Mock the session module
vi.mock('@/lib/session', () => ({
  getSession: vi.fn()
}))

const { getSession } = await import('@/lib/session')
const mockGetSession = vi.mocked(getSession)

describe('Settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/settings', () => {
    it('should return default settings for authenticated user', async () => {
      mockGetSession.mockResolvedValue({ shop: 'test-shop.myshopify.com', accessToken: 'test-token' })

      const request = new NextRequest('http://localhost:3000/api/settings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.shopDomain).toBe('test-shop.myshopify.com')
      expect(data.data.gstConfiguration).toBeDefined()
      expect(data.data.businessInfo).toBeDefined()
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/settings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('PUT /api/settings', () => {
    it('should update settings for authenticated user', async () => {
      mockGetSession.mockResolvedValue({ shop: 'test-shop.myshopify.com', accessToken: 'test-token' })

      const updates = {
        businessInfo: {
          companyName: 'Test Company',
          gstin: '22AAAAA0000A1Z5'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.businessInfo.companyName).toBe('Test Company')
      expect(data.data.businessInfo.gstin).toBe('22AAAAA0000A1Z5')
    })

    it('should validate GSTIN format', async () => {
      mockGetSession.mockResolvedValue({ shop: 'test-shop.myshopify.com', accessToken: 'test-token' })

      const updates = {
        businessInfo: {
          gstin: 'invalid-gstin'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Invalid GSTIN format')
    })

    it('should validate pincode format', async () => {
      mockGetSession.mockResolvedValue({ shop: 'test-shop.myshopify.com', accessToken: 'test-token' })

      const updates = {
        businessInfo: {
          address: {
            pincode: 'invalid-pincode'
          }
        }
      }

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Invalid pincode format')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })
})