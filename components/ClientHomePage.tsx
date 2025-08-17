'use client'

import { Suspense } from 'react'
import { TestPolaris } from '@/components/TestPolaris'
import { Page } from '@shopify/polaris'
import { AppErrorBoundary } from '@/lib/error-handling/AppErrorHandler'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4">Loading orders...</p>
      </div>
    </div>
  )
}

export default function ClientHomePage() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Page title="Order Printer - GST Compliant">
          <TestPolaris />
        </Page>
      </Suspense>
    </AppErrorBoundary>
  )
}