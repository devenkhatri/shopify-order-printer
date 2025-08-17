import { AuthWrapper } from '@/components/auth/AuthWrapper'
import { OrdersList } from '@/components/orders/OrdersList'
import { Page } from '@shopify/polaris'

export default function HomePage() {
  return (
    <AuthWrapper>
      <Page title="Order Printer - GST Compliant">
        <OrdersList />
      </Page>
    </AuthWrapper>
  )
}