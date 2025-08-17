'use client'

import { ReactNode, useEffect, useState } from 'react'
import { AppProvider as PolarisAppProvider } from '@shopify/polaris'
import enTranslations from '@shopify/polaris/locales/en.json'

// Import Polaris CSS
import '@shopify/polaris/build/esm/styles.css'

interface PolarisProviderProps {
  children: ReactNode
}

export function PolarisProvider({ children }: PolarisProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <PolarisAppProvider 
      i18n={enTranslations}
      features={{
        newDesignLanguage: true,
      }}
    >
      {children}
    </PolarisAppProvider>
  )
}