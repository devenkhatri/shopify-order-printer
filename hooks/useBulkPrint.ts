'use client'

import { useState, useCallback, useEffect } from 'react'
import { BulkPrintJob, BulkPrintRequest } from '@/types/shopify'
import { useAuth } from './useAuth'

interface UseBulkPrintReturn {
  startBulkPrint: (request: BulkPrintRequest) => Promise<BulkPrintJob>
  getJobStatus: (jobId: string) => Promise<BulkPrintJob>
  cancelJob: (jobId: string) => Promise<void>
  activeJobs: BulkPrintJob[]
  loading: boolean
  error: string | null
}

export function useBulkPrint(): UseBulkPrintReturn {
  const { isAuthenticated } = useAuth()
  const [activeJobs, setActiveJobs] = useState<BulkPrintJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startBulkPrint = useCallback(async (request: BulkPrintRequest): Promise<BulkPrintJob> => {
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
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start bulk print job')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Bulk print job failed to start')
      }

      const job = data.job as BulkPrintJob
      setActiveJobs(prev => [...prev, job])
      
      return job
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start bulk print'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const getJobStatus = useCallback(async (jobId: string): Promise<BulkPrintJob> => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`/api/print/jobs/${jobId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get job status')
      }

      const job = await response.json()
      
      // Update the job in active jobs list
      setActiveJobs(prev => 
        prev.map(activeJob => 
          activeJob.id === jobId ? job : activeJob
        )
      )
      
      return job
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get job status'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [isAuthenticated])

  const cancelJob = useCallback(async (jobId: string): Promise<void> => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`/api/print/jobs/${jobId}/cancel`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel job')
      }

      // Remove job from active jobs or update its status
      setActiveJobs(prev => 
        prev.filter(job => job.id !== jobId)
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel job'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [isAuthenticated])

  // Poll active jobs for status updates
  useEffect(() => {
    if (activeJobs.length === 0) return

    const pollInterval = setInterval(async () => {
      const processingJobs = activeJobs.filter(job => 
        job.status === 'pending' || job.status === 'processing'
      )

      for (const job of processingJobs) {
        try {
          await getJobStatus(job.id)
        } catch (error) {
          console.error(`Failed to poll job ${job.id}:`, error)
        }
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [activeJobs, getJobStatus])

  // Clean up completed jobs after some time
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setActiveJobs(prev => 
        prev.filter(job => {
          if (job.status === 'completed' || job.status === 'failed') {
            const jobAge = Date.now() - new Date(job.createdAt).getTime()
            return jobAge < 5 * 60 * 1000 // Keep for 5 minutes
          }
          return true
        })
      )
    }, 60000) // Check every minute

    return () => clearInterval(cleanupInterval)
  }, [])

  return {
    startBulkPrint,
    getJobStatus,
    cancelJob,
    activeJobs,
    loading,
    error
  }
}

// Hook for managing date range filtering
export function useDateRangeFilter() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  })

  const formatDateRange = useCallback(() => {
    const startStr = dateRange.start.toLocaleDateString('en-IN')
    const endStr = dateRange.end.toLocaleDateString('en-IN')
    return `${startStr} - ${endStr}`
  }, [dateRange])

  const isDateInRange = useCallback((date: Date) => {
    return date >= dateRange.start && date <= dateRange.end
  }, [dateRange])

  const setPresetRange = useCallback((preset: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth') => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (preset) {
      case 'today':
        setDateRange({ start: today, end: now })
        break
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        setDateRange({ start: yesterday, end: yesterday })
        break
      case 'last7days':
        const last7Days = new Date(today)
        last7Days.setDate(last7Days.getDate() - 7)
        setDateRange({ start: last7Days, end: now })
        break
      case 'last30days':
        const last30Days = new Date(today)
        last30Days.setDate(last30Days.getDate() - 30)
        setDateRange({ start: last30Days, end: now })
        break
      case 'thisMonth':
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        setDateRange({ start: thisMonthStart, end: now })
        break
      case 'lastMonth':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        setDateRange({ start: lastMonthStart, end: lastMonthEnd })
        break
    }
  }, [])

  return {
    dateRange,
    setDateRange,
    formatDateRange,
    isDateInRange,
    setPresetRange
  }
}