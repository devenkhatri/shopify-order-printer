'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Navigation,
  Frame,
  TopBar,
  Text
} from '@shopify/polaris'
import { 
  HomeIcon,
  OrderIcon,
  FileIcon,
  PrintIcon,
  SettingsIcon
} from '@shopify/polaris-icons'

interface AppNavigationProps {
  children: React.ReactNode
}

export function AppNavigation({ children }: AppNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false)

  const toggleMobileNavigationActive = () =>
    setMobileNavigationActive(!mobileNavigationActive)

  const navigationMarkup = (
    <Navigation location={pathname}>
      <Navigation.Section
        items={[
          {
            url: '/',
            label: 'Home',
            icon: HomeIcon,
            selected: pathname === '/'
          },
          {
            url: '/orders',
            label: 'Orders',
            icon: OrderIcon,
            selected: pathname.startsWith('/orders')
          },
          {
            url: '/templates',
            label: 'Templates',
            icon: FileIcon,
            selected: pathname.startsWith('/templates')
          },
          {
            url: '/bulk-print',
            label: 'Bulk Print',
            icon: PrintIcon,
            selected: pathname.startsWith('/bulk-print')
          },
          {
            url: '/settings',
            label: 'Settings',
            icon: SettingsIcon,
            selected: pathname.startsWith('/settings')
          }
        ]}
      />
    </Navigation>
  )

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNavigationActive}
    />
  )

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigationActive}
    >
      {children}
    </Frame>
  )
}