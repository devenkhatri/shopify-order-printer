'use client'

import { useRouter } from 'next/navigation'
import { AppProvider } from '@/components/providers/AppProvider'
import { AppLayout } from '@/components/layout/AppLayout'
import { OrdersList } from '@/components/orders/OrdersList'

export default function OrdersPage() {
  const router = useRouter()

  const handleOrderSelect = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  return (
    <AppProvider>
      <AppLayout>
        <OrdersList onOrderSelect={handleOrderSelect} />
      </AppLayout>
    </AppProvider>
  )
}