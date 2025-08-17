'use client'

import { useState, useEffect } from 'react'
import { AppSettings } from '@/types'

interface UseSettingsReturn {
  settings: AppSettings | null
  loading: boolean
  error: string | null
  updateSettings: (updates: Partial<AppSettings>) => Promise<boolean>
  refreshSettings: () => Promise<void>
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/settings')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch settings')
      }
      
      setSettings(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings')
      console.error('Error fetching settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (updates: Partial<AppSettings>): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings')
      }
      
      setSettings(result.data)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      console.error('Error updating settings:', err)
      return false
    }
  }

  const refreshSettings = async () => {
    await fetchSettings()
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings
  }
}