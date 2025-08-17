'use client'

import { ReactNode } from 'react'
import { AppNavigation } from '@/components/navigation/AppNavigation'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppNavigation>
      {children}
    </AppNavigation>
  )
}