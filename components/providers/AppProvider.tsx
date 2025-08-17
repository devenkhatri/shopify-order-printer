'use client'

import { ReactNode } from 'react'
import { AppBridgeProvider } from './AppBridgeProvider'
import { PolarisProvider } from './PolarisProvider'
import { QueryProvider } from './QueryProvider'

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <AppBridgeProvider>
      <PolarisProvider>
        <QueryProvider>
          {children}
        </QueryProvider>
      </PolarisProvider>
    </AppBridgeProvider>
  )
}