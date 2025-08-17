import { AppProvider } from '@/components/providers/AppProvider'
import { BulkPrintInterface } from '@/components/bulk-print/BulkPrintInterface'

export default function BulkPrintPage() {
  return (
    <AppProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Bulk Print Orders</h1>
        <BulkPrintInterface />
      </div>
    </AppProvider>
  )
}