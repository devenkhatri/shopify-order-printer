'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  shop: string | null
  error: string | null
}

export function useAuth() {
  const searchParams = useSearchParams()
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    shop: null,
    error: null
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const shop = searchParams.get('shop')
        
        if (!shop) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            shop: null,
            error: 'No shop parameter found'
          })
          return
        }

        // Check session validity
        const response = await fetch(`/api/auth/session?shop=${shop}`)
        const data = await response.json()

        if (response.ok && data.authenticated) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            shop: data.shop,
            error: null
          })
        } else {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            shop: shop,
            error: data.error || 'Authentication required'
          })
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          shop: null,
          error: 'Failed to check authentication'
        })
      }
    }

    checkAuth()
  }, [searchParams])

  const initiateAuth = async (shop: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop })
      })

      const data = await response.json()

      if (response.ok && data.authUrl) {
        window.location.href = data.authUrl
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Failed to initiate authentication'
        }))
      }
    } catch (error) {
      console.error('Auth initiation failed:', error)
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initiate authentication'
      }))
    }
  }

  return {
    ...authState,
    initiateAuth
  }
}