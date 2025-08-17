import { AppProvider } from '@/components/providers/AppProvider'
import { OrdersList } from '@/components/orders/OrdersList'

export default function OrdersPage() {
  return (
    <AppProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Orders Management</h1>
        <OrdersList />
      </div>
    </AppProvider>
  )
}