'use client'

import { Card, Page, Text } from '@shopify/polaris'

interface OrderDetailProps {
  orderId: string
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  // Placeholder component - will be implemented in later tasks
  return (
    <Page title={`Order #${orderId}`}>
      <Card>
        <Text as="p">Order details will be displayed here with GST breakdown.</Text>
      </Card>
    </Page>
  )
}