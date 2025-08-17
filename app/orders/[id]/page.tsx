'use client'

import { useRouter } from 'next/navigation'
import { AppProvider } from '@/components/providers/AppProvider'
import { AppLayout } from '@/components/layout/AppLayout'
import { OrderDetail } from '@/components/orders/OrderDetail'

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push('/orders')
  }

  const handlePrint = (orderId: string) => {
    console.log('Print order:', orderId)
  }

  const handleEdit = (orderId: string) => {
    console.log('Edit order:', orderId)
  }

  return (
    <AppProvider>
      <AppLayout>
        <OrderDetail 
          orderId={params.id}
          onBack={handleBack}
          onPrint={handlePrint}
          onEdit={handleEdit}
        />
      </AppLayout>
    </AppProvider>
  )
}