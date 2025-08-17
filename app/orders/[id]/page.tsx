import { AppProvider } from '@/components/providers/AppProvider'
import { OrderDetail } from '@/components/orders/OrderDetail'

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  return (
    <AppProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Order Details</h1>
        <OrderDetail orderId={params.id} />
      </div>
    </AppProvider>
  )
}