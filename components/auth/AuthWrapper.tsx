'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, Page, Spinner, Button, Banner } from '@shopify/polaris'

interface AuthWrapperProps {
  children: ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, isLoading, shop, error, initiateAuth } = useAuth()

  if (isLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Spinner size="large" />
            <p className="mt-4">Authenticating...</p>
          </div>
        </div>
      </Page>
    )
  }

  if (!isAuthenticated) {
    return (
      <Page title="Authentication Required">
        <Card>
          <div className="text-center p-8">
            {error && (
              <div className="mb-4">
                <Banner tone="critical">
                  {error}
                </Banner>
              </div>
            )}
            
            <h2 className="text-xl font-semibold mb-4">
              Connect your Shopify store
            </h2>
            
            <p className="text-gray-600 mb-6">
              This app needs to connect to your Shopify store to manage orders and generate GST-compliant receipts.
            </p>

            {shop ? (
              <Button
                variant="primary"
                onClick={() => initiateAuth(shop)}
                loading={isLoading}
              >
                Connect to {shop}
              </Button>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Please install this app from your Shopify admin panel.
                </p>
                <Button
                  onClick={() => window.location.href = '/'}
                >
                  Go to Shopify Admin
                </Button>
              </div>
            )}
          </div>
        </Card>
      </Page>
    )
  }

  return <>{children}</>
}