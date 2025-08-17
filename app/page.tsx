import { AppProvider } from '@/components/providers/AppProvider'
import { OrdersList } from '@/components/orders/OrdersList'

export default function HomePage() {
  return (
    <AppProvider>
      <main className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Order Printer - GST Compliant</h1>
        <OrdersList />
      </main>
    </AppProvider>
  )
}