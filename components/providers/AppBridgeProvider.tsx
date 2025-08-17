'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface AppBridgeProviderProps {
  children: ReactNode
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  const searchParams = useSearchParams()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const shop = searchParams.get('shop')
    
    if (!shop) {
      // If no shop parameter, redirect to auth
      window.location.href = `/api/auth?shop=${window.location.hostname}`
      return
    }

    // Initialize App Bridge
    const config = {
      apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
      host: searchParams.get('host') || btoa(`${shop}/admin`),
      forceRedirect: true,
    }
    
    // App Bridge initialization would go here
    setIsReady(true)
  }, [searchParams])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Initializing app...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}