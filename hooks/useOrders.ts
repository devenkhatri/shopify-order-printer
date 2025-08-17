'use client'

import { useState, useEffect, useCallback } from 'react'
import { OrderWithGST } from '@/types/shopify'
import { useAuth } from './useAuth'

interface UseOrdersOptions {
  limit?: number
  status?: string
  autoFetch?: boolean
}

interface UseOrdersReturn {
  orders: OrderWithGST[]
  loading: boolean
  error: string | null
  hasNextPage: boolean
  cursor: string | null
  fetchOrders: (resetPagination?: boolean) => Promise<void>
  refetch: () => Promise<void>
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const { limit = 50, status, autoFetch = true } = options
  const { isAuthenticated, shop } = useAuth()
  
  const [orders, setOrders] = useState<OrderWithGST[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)

  const fetchOrders = useCallback(async (resetPagination = false) => {
    if (!isAuthenticated || !shop) {
      setError('Not authenticated')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(status && { status }),
        ...(cursor && !resetPagination && { cursor })
      })

      const response = await fetch(`/api/orders?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch orders')
      }

      const data = await response.json()
      
      if (resetPagination) {
        setOrders(data.orders)
        setCursor(null)
      } else {
        setOrders(data.orders)
      }
      
      setHasNextPage(data.hasNextPage)
      setCursor(data.cursor)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, shop, limit, status, cursor])

  const refetch = useCallback(() => {
    return fetchOrders(true)
  }, [fetchOrders])

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch && isAuthenticated) {
      fetchOrders(true)
    }
  }, [autoFetch, isAuthenticated, status])

  return {
    orders,
    loading,
    error,
    hasNextPage,
    cursor,
    fetchOrders,
    refetch
  }
}

// Hook for fetching a single order
export function useOrder(orderId: string | null) {
  const { isAuthenticated, shop } = useAuth()
  const [order, setOrder] = useState<OrderWithGST | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId || !isAuthenticated || !shop) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/orders/${orderId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found')
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch order')
      }

      const orderData = await response.json()
      setOrder(orderData)
    } catch (err) {
      console.error(`Failed to fetch order ${orderId}:`, err)
      setError(err instanceof Error ? err.message : 'Failed to fetch order')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderId, isAuthenticated, shop])

  useEffect(() => {
    if (orderId && isAuthenticated) {
      fetchOrder()
    } else {
      setOrder(null)
      setError(null)
    }
  }, [orderId, isAuthenticated, fetchOrder])

  return {
    order,
    loading,
    error,
    refetch: fetchOrder
  }
}