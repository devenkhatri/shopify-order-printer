'use client'

import { useState } from 'react'
import { useAuth } from './useAuth'

interface PrintJob {
  id: string
  orderId: string
  orderName: string
  format: 'pdf' | 'csv'
  templateId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
  error?: string
  createdAt: string
}

interface UsePrintReturn {
  printOrder: (orderId: string, options?: { format?: 'pdf' | 'csv', templateId?: string }) => Promise<PrintJob>
  printBulk: (orderIds: string[], options?: { format?: 'pdf' | 'csv', templateId?: string }) => Promise<PrintJob>
  loading: boolean
  error: string | null
}

export function usePrint(): UsePrintReturn {
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const printOrder = async (
    orderId: string, 
    options: { format?: 'pdf' | 'csv', templateId?: string } = {}
  ): Promise<PrintJob> => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          format: options.format || 'pdf',
          templateId: options.templateId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to print order')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Print job failed')
      }

      return data.printJob
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to print order'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const printBulk = async (
    orderIds: string[], 
    options: { format?: 'pdf' | 'csv', templateId?: string } = {}
  ): Promise<PrintJob> => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/print/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds,
          format: options.format || 'pdf',
          templateId: options.templateId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to print orders')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Bulk print job failed')
      }

      return data.printJob
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to print orders'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    printOrder,
    printBulk,
    loading,
    error
  }
}

// Hook for tracking print job status
export function usePrintJob(jobId: string | null) {
  const [job, setJob] = useState<PrintJob | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJob = async () => {
    if (!jobId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/print/jobs/${jobId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch print job')
      }

      const jobData = await response.json()
      setJob(jobData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch print job'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    job,
    loading,
    error,
    refetch: fetchJob
  }
}