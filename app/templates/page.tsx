'use client'

import { AppProvider } from '@/components/providers/AppProvider'
import { TemplatesList } from '@/components/templates/TemplatesList'

export default function TemplatesPage() {
  return (
    <AppProvider>
      <TemplatesList />
    </AppProvider>
  )
}