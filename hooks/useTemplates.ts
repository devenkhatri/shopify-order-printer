import { useState, useEffect, useCallback } from 'react'
import { Template, BusinessInfo, ApiResponse } from '../types/shopify'

export interface UseTemplatesReturn {
  templates: Template[]
  loading: boolean
  error: string | null
  createTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiResponse<Template>>
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<ApiResponse<Template>>
  deleteTemplate: (id: string) => Promise<ApiResponse<void>>
  getTemplate: (id: string) => Promise<ApiResponse<Template>>
  getDefaultTemplate: () => Promise<ApiResponse<Template>>
  refreshTemplates: () => Promise<void>
}

export interface UseBusinessInfoReturn {
  businessInfo: BusinessInfo | null
  loading: boolean
  error: string | null
  saveBusinessInfo: (info: BusinessInfo) => Promise<ApiResponse<BusinessInfo>>
  refreshBusinessInfo: () => Promise<void>
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/templates')
      const result = await response.json()
      
      if (result.success) {
        setTemplates(result.data || [])
      } else {
        setError(result.error || 'Failed to load templates')
      }
    } catch (err) {
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  const createTemplate = useCallback(async (
    template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Template>> => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await refreshTemplates()
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create template'
      }
    }
  }, [refreshTemplates])

  const updateTemplate = useCallback(async (
    id: string, 
    updates: Partial<Template>
  ): Promise<ApiResponse<Template>> => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await refreshTemplates()
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update template'
      }
    }
  }, [refreshTemplates])

  const deleteTemplate = useCallback(async (id: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await refreshTemplates()
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete template'
      }
    }
  }, [refreshTemplates])

  const getTemplate = useCallback(async (id: string): Promise<ApiResponse<Template>> => {
    try {
      const response = await fetch(`/api/templates/${id}`)
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get template'
      }
    }
  }, [])

  const getDefaultTemplate = useCallback(async (): Promise<ApiResponse<Template>> => {
    try {
      const response = await fetch('/api/templates/default')
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get default template'
      }
    }
  }, [])

  useEffect(() => {
    refreshTemplates()
  }, [refreshTemplates])

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    getDefaultTemplate,
    refreshTemplates
  }
}

export function useBusinessInfo(): UseBusinessInfoReturn {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshBusinessInfo = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/business-info')
      const result = await response.json()
      
      if (result.success) {
        setBusinessInfo(result.data)
      } else {
        setError(result.error || 'Failed to load business information')
      }
    } catch (err) {
      setError('Failed to load business information')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveBusinessInfo = useCallback(async (info: BusinessInfo): Promise<ApiResponse<BusinessInfo>> => {
    try {
      const response = await fetch('/api/business-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setBusinessInfo(result.data)
      }
      
      return result
    } catch (error) {
      return {
        success: false,
        error: 'Failed to save business information'
      }
    }
  }, [])

  useEffect(() => {
    refreshBusinessInfo()
  }, [refreshBusinessInfo])

  return {
    businessInfo,
    loading,
    error,
    saveBusinessInfo,
    refreshBusinessInfo
  }
}