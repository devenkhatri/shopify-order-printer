import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AppProvider } from '@/components/providers/AppProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Order Printer - GST Compliant Shopify App',
  description: 'Print orders with GST calculations for Indian T-shirt stores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}