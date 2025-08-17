'use client'

import { useState } from 'react'
import { 
  Card, 
  Page, 
  Text, 
  Spinner,
  EmptyState,
  Layout,
  Badge,
  Button,
  BlockStack,
  Divider,
  DataTable,
  Banner,
  Box,
  Toast,
  Frame,
  Modal,
  Select,
  InlineStack
} from '@shopify/polaris'
import { PrintIcon, EditIcon } from '@shopify/polaris-icons'
import { useOrder } from '@/hooks/useOrders'
import { usePrint } from '@/hooks/usePrint'
import { OrderWithGST, LineItem } from '@/types/shopify'
import { extractTShirtDetails, formatTShirtDetails, isTShirtProduct } from '@/lib/utils/productUtils'

interface OrderDetailProps {
  orderId: string
  onBack?: () => void
  onPrint?: (orderId: string) => void
  onEdit?: (orderId: string) => void
}

export function OrderDetail({ orderId, onBack, onPrint, onEdit }: OrderDetailProps) {
  const { order, loading, error, refetch } = useOrder(orderId)
  const { printOrder, loading: printLoading } = usePrint()
  
  const [toastActive, setToastActive] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastError, setToastError] = useState(false)
  const [printModalActive, setPrintModalActive] = useState(false)
  const [printFormat, setPrintFormat] = useState<'pdf' | 'csv'>('pdf')

  // Handle print order
  const handlePrintOrder = async () => {
    if (!order) return

    try {
      const printJob = await printOrder(order.id, { format: printFormat })
      setToastMessage(`Order ${order.name} queued for ${printFormat.toUpperCase()} printing`)
      setToastError(false)
      setToastActive(true)
      setPrintModalActive(false)
      
      // If download URL is available, open it
      if (printJob.downloadUrl) {
        window.open(printJob.downloadUrl, '_blank')
      }
      
      // Call the onPrint callback if provided
      if (onPrint) {
        onPrint(order.id)
      }
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Failed to print order')
      setToastError(true)
      setToastActive(true)
    }
  }

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(num)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge variant
  const getStatusBadgeStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'authorized':
        return 'info'
      case 'refunded':
        return 'critical'
      case 'voided':
        return 'critical'
      default:
        return 'new'
    }
  }

  // Get fulfillment status badge variant
  const getFulfillmentStatusBadgeStatus = (status: string | null) => {
    if (!status) return 'warning'
    
    switch (status.toLowerCase()) {
      case 'fulfilled':
        return 'success'
      case 'partial':
        return 'warning'
      case 'unfulfilled':
        return 'critical'
      default:
        return 'new'
    }
  }

  // Format fulfillment status
  const formatFulfillmentStatus = (status: string | null) => {
    if (!status) return 'Unfulfilled'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }



  // Prepare line items table data
  const prepareLineItemsData = (order: OrderWithGST) => {
    return order.line_items.map(item => {
      const tshirtDetails = extractTShirtDetails(item)
      const itemTotal = parseFloat(item.price) * item.quantity
      
      return [
        // Product name and variant
        <div key={`product-${item.id}`}>
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            {item.title}
          </Text>
          {item.variant_title && (
            <Text as="p" variant="bodySm" tone="subdued">
              {item.variant_title}
            </Text>
          )}
          {item.sku && (
            <Text as="p" variant="bodySm" tone="subdued">
              SKU: {item.sku}
            </Text>
          )}
        </div>,
        
        // T-shirt specific details
        <div key={`details-${item.id}`}>
          {isTShirtProduct(item) ? (
            <BlockStack gap="100">
              <InlineStack gap="200">
                {tshirtDetails.size && (
                  <Badge tone="info">{`Size: ${tshirtDetails.size}`}</Badge>
                )}
                {tshirtDetails.color && (
                  <Badge>{`Color: ${tshirtDetails.color}`}</Badge>
                )}
                {tshirtDetails.material && (
                  <Badge tone="success">{`Material: ${tshirtDetails.material}`}</Badge>
                )}
              </InlineStack>
              {(tshirtDetails.fit || tshirtDetails.sleeve || tshirtDetails.neckline) && (
                <InlineStack gap="200">
                  {tshirtDetails.fit && (
                    <Badge tone="attention">{`Fit: ${tshirtDetails.fit}`}</Badge>
                  )}
                  {tshirtDetails.sleeve && (
                    <Badge>{`Sleeve: ${tshirtDetails.sleeve}`}</Badge>
                  )}
                  {tshirtDetails.neckline && (
                    <Badge>{`Neckline: ${tshirtDetails.neckline}`}</Badge>
                  )}
                </InlineStack>
              )}
              {tshirtDetails.design && (
                <Text as="p" variant="bodySm" tone="subdued">
                  Design: {tshirtDetails.design}
                </Text>
              )}
              {tshirtDetails.brand && (
                <Text as="p" variant="bodySm" tone="subdued">
                  Brand: {tshirtDetails.brand}
                </Text>
              )}
            </BlockStack>
          ) : (
            <Text as="p" variant="bodySm" tone="subdued">
              Product details
            </Text>
          )}
        </div>,
        
        // Quantity
        item.quantity,
        
        // Unit price
        formatCurrency(item.price),
        
        // Total
        formatCurrency(itemTotal)
      ]
    })
  }

  if (loading) {
    return (
      <Page title="Loading Order...">
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spinner size="large" />
            <Text as="p" variant="bodyMd" tone="subdued">
              Loading order details...
            </Text>
          </div>
        </Card>
      </Page>
    )
  }

  if (error) {
    return (
      <Page 
        title="Error"
        backAction={onBack ? { onAction: onBack } : undefined}
      >
        <Card>
          <EmptyState
            heading="Error Loading Order"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            action={{
              content: 'Retry',
              onAction: refetch
            }}
          >
            <p>{error}</p>
          </EmptyState>
        </Card>
      </Page>
    )
  }

  if (!order) {
    return (
      <Page 
        title="Order Not Found"
        backAction={onBack ? { onAction: onBack } : undefined}
      >
        <Card>
          <EmptyState
            heading="Order Not Found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>The order you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          </EmptyState>
        </Card>
      </Page>
    )
  }

  const customerName = order.customer 
    ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
    : 'Guest'

  const lineItemsData = prepareLineItemsData(order)

  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastActive(false)}
    />
  ) : null

  const printModalMarkup = (
    <Modal
      open={printModalActive}
      onClose={() => setPrintModalActive(false)}
      title="Print Order"
      primaryAction={{
        content: 'Print',
        onAction: handlePrintOrder,
        loading: printLoading
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: () => setPrintModalActive(false)
        }
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p" variant="bodyMd">
            Choose the format for printing order {order.name}:
          </Text>
          <Select
            label="Print Format"
            options={[
              { label: 'PDF Document', value: 'pdf' },
              { label: 'CSV Spreadsheet', value: 'csv' }
            ]}
            value={printFormat}
            onChange={(value) => setPrintFormat(value as 'pdf' | 'csv')}
          />
        </BlockStack>
      </Modal.Section>
    </Modal>
  )

  return (
    <Frame>
      {toastMarkup}
      {printModalMarkup}
    <Page 
      title={`Order ${order.name}`}
      subtitle={`Placed on ${formatDate(order.created_at)}`}
      backAction={onBack ? { onAction: onBack } : undefined}
      primaryAction={{
        content: 'Print Order',
        icon: PrintIcon,
        onAction: () => setPrintModalActive(true)
      }}
      secondaryActions={[
        {
          content: 'Edit',
          icon: EditIcon,
          onAction: () => onEdit?.(order.id)
        }
      ]}
    >
      <Layout>
        <Layout.Section>
          {/* Order Status Banner */}
          {order.financial_status === 'pending' && (
            <Banner tone="warning" title="Payment Pending">
              This order is awaiting payment confirmation.
            </Banner>
          )}
          
          {order.fulfillment_status === null && order.financial_status === 'paid' && (
            <Banner tone="info" title="Ready to Fulfill">
              This paid order is ready for fulfillment.
            </Banner>
          )}

          {order.financial_status === 'refunded' && (
            <Banner tone="critical" title="Order Refunded">
              This order has been refunded.
            </Banner>
          )}
          
          {/* Order Summary */}
          <Card>
            <Text as="h2" variant="headingMd">
              Order Summary
            </Text>
            <Box paddingBlockStart="400">
              <InlineStack align="space-between">
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Payment Status
                  </Text>
                  <Badge tone={getStatusBadgeStatus(order.financial_status)}>
                    {order.financial_status.charAt(0).toUpperCase() + order.financial_status.slice(1)}
                  </Badge>
                </BlockStack>

                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Fulfillment Status
                  </Text>
                  <Badge tone={getFulfillmentStatusBadgeStatus(order.fulfillment_status)}>
                    {formatFulfillmentStatus(order.fulfillment_status)}
                  </Badge>
                </BlockStack>
                
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Total Amount
                  </Text>
                  <Text as="p" variant="headingMd">
                    {formatCurrency(order.total_price)}
                  </Text>
                </BlockStack>
                
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Payment Method
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {order.gateway || 'Not specified'}
                  </Text>
                </BlockStack>
              </InlineStack>
            </Box>
          </Card>

          {/* Line Items */}
          <Card>
            <Text as="h2" variant="headingMd">
              Items Ordered
            </Text>
            <Box paddingBlockStart="400">
              <DataTable
                columnContentTypes={['text', 'text', 'numeric', 'numeric', 'numeric']}
                headings={['Product', 'Details', 'Quantity', 'Price', 'Total']}
                rows={lineItemsData}
              />
            </Box>
          </Card>

          {/* GST Breakdown */}
          {order.gstBreakdown && order.gstBreakdown.totalGstAmount > 0 && (
            <Card>
              <Text as="h2" variant="headingMd">
                GST Breakdown
              </Text>
              <Box paddingBlockStart="400">
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd">
                      Taxable Amount:
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {formatCurrency(order.gstBreakdown.taxableAmount)}
                    </Text>
                  </InlineStack>
                  
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd">
                      GST Rate:
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {(order.gstBreakdown.gstRate * 100).toFixed(1)}%
                    </Text>
                  </InlineStack>

                  {order.gstBreakdown.gstType === 'CGST_SGST' ? (
                    <>
                      <InlineStack align="space-between">
                        <Text as="p" variant="bodyMd">
                          CGST ({(order.gstBreakdown.gstRate * 50).toFixed(1)}%):
                        </Text>
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          {formatCurrency(order.gstBreakdown.cgstAmount || 0)}
                        </Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="p" variant="bodyMd">
                          SGST ({(order.gstBreakdown.gstRate * 50).toFixed(1)}%):
                        </Text>
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          {formatCurrency(order.gstBreakdown.sgstAmount || 0)}
                        </Text>
                      </InlineStack>
                    </>
                  ) : (
                    <InlineStack align="space-between">
                      <Text as="p" variant="bodyMd">
                        IGST ({(order.gstBreakdown.gstRate * 100).toFixed(1)}%):
                      </Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        {formatCurrency(order.gstBreakdown.igstAmount || 0)}
                      </Text>
                    </InlineStack>
                  )}

                  <Divider />
                  
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Total GST:
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {formatCurrency(order.gstBreakdown.totalGstAmount)}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>
          )}
        </Layout.Section>

        <Layout.Section variant="oneThird">
          {/* Customer Information */}
          <Card>
            <Text as="h2" variant="headingMd">
              Customer
            </Text>
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    {customerName}
                  </Text>
                  {order.customer?.email && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {order.customer.email}
                    </Text>
                  )}
                  {order.customer?.phone && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {order.customer.phone}
                    </Text>
                  )}
                </div>
              </BlockStack>
            </Box>
          </Card>

          {/* Shipping Address */}
          {order.shipping_address && (
            <Card>
              <Text as="h2" variant="headingMd">
                Shipping Address
              </Text>
              <Box paddingBlockStart="400">
                <BlockStack gap="200">
                  {order.shipping_address.name && (
                    <Text as="p" variant="bodyMd">
                      {order.shipping_address.name}
                    </Text>
                  )}
                  {order.shipping_address.address1 && (
                    <Text as="p" variant="bodyMd">
                      {order.shipping_address.address1}
                    </Text>
                  )}
                  {order.shipping_address.address2 && (
                    <Text as="p" variant="bodyMd">
                      {order.shipping_address.address2}
                    </Text>
                  )}
                  <Text as="p" variant="bodyMd">
                    {[
                      order.shipping_address.city,
                      order.shipping_address.province,
                      order.shipping_address.zip
                    ].filter(Boolean).join(', ')}
                  </Text>
                  {order.shipping_address.country && (
                    <Text as="p" variant="bodyMd">
                      {order.shipping_address.country}
                    </Text>
                  )}
                </BlockStack>
              </Box>
            </Card>
          )}

          {/* Billing Address */}
          {order.billing_address && (
            <Card>
              <Text as="h2" variant="headingMd">
                Billing Address
              </Text>
              <Box paddingBlockStart="400">
                <BlockStack gap="200">
                  {order.billing_address.name && (
                    <Text as="p" variant="bodyMd">
                      {order.billing_address.name}
                    </Text>
                  )}
                  {order.billing_address.address1 && (
                    <Text as="p" variant="bodyMd">
                      {order.billing_address.address1}
                    </Text>
                  )}
                  {order.billing_address.address2 && (
                    <Text as="p" variant="bodyMd">
                      {order.billing_address.address2}
                    </Text>
                  )}
                  <Text as="p" variant="bodyMd">
                    {[
                      order.billing_address.city,
                      order.billing_address.province,
                      order.billing_address.zip
                    ].filter(Boolean).join(', ')}
                  </Text>
                  {order.billing_address.country && (
                    <Text as="p" variant="bodyMd">
                      {order.billing_address.country}
                    </Text>
                  )}
                </BlockStack>
              </Box>
            </Card>
          )}
        </Layout.Section>
      </Layout>
      </Page>
    </Frame>
  )
}