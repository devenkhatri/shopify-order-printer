'use client'

import { ReactNode, Suspense } from 'react'
import { AppBridgeProvider } from './AppBridgeProvider'
import { PolarisProvider } from './PolarisProvider'
import { QueryProvider } from './QueryProvider'

interface AppProviderProps {
  children: ReactNode
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading application...</p>
      </div>
    </div>
  )
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <PolarisProvider>
      <Suspense fallback={<LoadingFallback />}>
        <AppBridgeProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AppBridgeProvider>
      </Suspense>
    </PolarisProvider>
  )
}