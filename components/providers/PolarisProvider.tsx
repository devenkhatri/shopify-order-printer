'use client'

import { ReactNode } from 'react'
import { AppProvider as PolarisAppProvider } from '@shopify/polaris'
import '@shopify/polaris/build/esm/styles.css'

interface PolarisProviderProps {
  children: ReactNode
}

export function PolarisProvider({ children }: PolarisProviderProps) {
  return (
    <PolarisAppProvider i18n={{}}>
      {children}
    </PolarisAppProvider>
  )
}