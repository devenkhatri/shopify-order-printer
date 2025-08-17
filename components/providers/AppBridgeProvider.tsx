'use client'

import { ReactNode } from 'react'
import { Provider as AppBridgeProvider as ShopifyAppBridgeProvider } from '@shopify/app-bridge-react'

interface AppBridgeProviderProps {
  children: ReactNode
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY!,
    host: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('host') || '' : '',
    forceRedirect: true,
  }

  return (
    <ShopifyAppBridgeProvider config={config}>
      {children}
    </ShopifyAppBridgeProvider>
  )
}