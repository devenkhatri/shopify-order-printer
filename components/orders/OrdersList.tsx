'use client'

import { Card, DataTable, Page } from '@shopify/polaris'

export function OrdersList() {
  // Placeholder component - will be implemented in later tasks
  const rows = [
    ['#1001', 'John Doe', '₹1,200', 'IGST: ₹144', 'Paid'],
    ['#1002', 'Jane Smith', '₹800', 'CGST: ₹20, SGST: ₹20', 'Pending'],
  ]

  return (
    <Page title="Orders">
      <Card>
        <DataTable
          columnContentTypes={['text', 'text', 'numeric', 'text', 'text']}
          headings={['Order', 'Customer', 'Total', 'GST Breakdown', 'Status']}
          rows={rows}
        />
      </Card>
    </Page>
  )
}