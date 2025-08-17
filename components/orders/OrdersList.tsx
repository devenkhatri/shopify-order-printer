'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  DataTable, 
  Page, 
  Filters,
  Select,
  Badge,
  Button,
  Spinner,
  EmptyState,
  Pagination,
  Text,
  ButtonGroup,
  Tooltip,
  Toast,
  Frame
} from '@shopify/polaris'
import { PrintIcon } from '@shopify/polaris-icons'
import { OrderWithGST } from '@/types/shopify'
import { useAuth } from '@/hooks/useAuth'
import { useOrders } from '@/hooks/useOrders'
import { usePrint } from '@/hooks/usePrint'

interface OrdersListProps {
  onOrderSelect?: (orderId: string) => void
  showActions?: boolean
}

export function OrdersList({ onOrderSelect, showActions = true }: OrdersListProps) {
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [toastActive, setToastActive] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastError, setToastError] = useState(false)
  
  const { 
    orders, 
    loading, 
    error, 
    hasNextPage, 
    fetchOrders, 
    refetch 
  } = useOrders({ 
    status: statusFilter || undefined,
    autoFetch: true 
  })

  const { printOrder, loading: printLoading } = usePrint()

  // Filter options
  const statusOptions = [
    { label: 'All Orders', value: '' },
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Authorized', value: 'authorized' },
    { label: 'Partially Paid', value: 'partially_paid' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Voided', value: 'voided' }
  ]

  // Refetch when status filter changes
  useEffect(() => {
    if (statusFilter !== '') {
      refetch()
      setCurrentPage(1)
    }
  }, [statusFilter, refetch])

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      order.name.toLowerCase().includes(query) ||
      order.order_number.toString().includes(query) ||
      (order.customer?.first_name?.toLowerCase().includes(query)) ||
      (order.customer?.last_name?.toLowerCase().includes(query)) ||
      (order.customer?.email?.toLowerCase().includes(query))
    )
  })

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(num)
  }

  // Format GST breakdown for display
  const formatGSTBreakdown = (gstBreakdown: any) => {
    if (!gstBreakdown || gstBreakdown.totalGstAmount === 0) {
      return 'No GST'
    }

    if (gstBreakdown.gstType === 'CGST_SGST') {
      return `CGST: ${formatCurrency(gstBreakdown.cgstAmount || 0)}, SGST: ${formatCurrency(gstBreakdown.sgstAmount || 0)}`
    } else {
      return `IGST: ${formatCurrency(gstBreakdown.igstAmount || 0)}`
    }
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

  // Handle order row click
  const handleOrderClick = (orderId: string) => {
    if (onOrderSelect) {
      onOrderSelect(orderId)
    }
  }

  // Handle print order
  const handlePrintOrder = async (orderId: string, orderName: string) => {
    try {
      const printJob = await printOrder(orderId, { format: 'pdf' })
      setToastMessage(`Order ${orderName} queued for printing`)
      setToastError(false)
      setToastActive(true)
      
      // If download URL is available, open it
      if (printJob.downloadUrl) {
        window.open(printJob.downloadUrl, '_blank')
      }
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Failed to print order')
      setToastError(true)
      setToastActive(true)
    }
  }

  // Show toast
  const showToast = (message: string, isError = false) => {
    setToastMessage(message)
    setToastError(isError)
    setToastActive(true)
  }

  // Prepare table rows
  const tableRows = filteredOrders.map(order => {
    const customerName = order.customer 
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
      : 'Guest'

    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    return [
      // Order number with click handler
      <Button
        key={`order-${order.id}`}
        variant="plain"
        onClick={() => handleOrderClick(order.id)}
      >
        {order.name}
      </Button>,
      
      // Order date
      orderDate,
      
      // Customer name
      customerName,
      
      // Order total
      formatCurrency(order.total_price),
      
      // GST breakdown
      <Tooltip key={`gst-${order.id}`} content={`GST Rate: ${((order.gstBreakdown?.gstRate || 0) * 100).toFixed(1)}%`}>
        <Text as="span" variant="bodySm">
          {formatGSTBreakdown(order.gstBreakdown)}
        </Text>
      </Tooltip>,
      
      // Status badge
      <Badge
        key={`status-${order.id}`}
        tone={getStatusBadgeStatus(order.financial_status)}
      >
        {order.financial_status.charAt(0).toUpperCase() + order.financial_status.slice(1)}
      </Badge>,
      
      // Actions
      showActions ? (
        <ButtonGroup key={`actions-${order.id}`}>
          <Button size="slim" onClick={() => handleOrderClick(order.id)}>
            View
          </Button>
          <Button 
            size="slim" 
            variant="primary"
            icon={PrintIcon}
            loading={printLoading}
            onClick={() => handlePrintOrder(order.id, order.name)}
          >
            Print
          </Button>
        </ButtonGroup>
      ) : null
    ].filter(Boolean)
  })

  // Table headings
  const headings = [
    'Order',
    'Date',
    'Customer',
    'Total',
    'GST Breakdown',
    'Status',
    ...(showActions ? ['Actions'] : [])
  ]

  // Column content types
  const columnContentTypes: ('text' | 'numeric')[] = [
    'text',
    'text', 
    'text',
    'numeric',
    'text',
    'text',
    ...(showActions ? ['text' as const] : [])
  ]

  // Handle pagination
  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
      fetchOrders()
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
      // Note: For previous page, we'd need to implement reverse pagination
      // For now, we'll refetch from the beginning
      fetchOrders(true)
    }
  }

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
  }

  // Filter component
  const filters = [
    {
      key: 'status',
      label: 'Status',
      filter: (
        <Select
          label="Status"
          labelHidden
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      )
    }
  ]

  if (!isAuthenticated) {
    return (
      <Page title="Orders">
        <Card>
          <EmptyState
            heading="Authentication Required"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Please authenticate with Shopify to view orders.</p>
          </EmptyState>
        </Card>
      </Page>
    )
  }

  if (error) {
    return (
      <Page title="Orders">
        <Card>
          <EmptyState
            heading="Error Loading Orders"
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

  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastActive(false)}
    />
  ) : null

  return (
    <Frame>
      {toastMarkup}
      <Page 
        title="Orders"
        subtitle={`${filteredOrders.length} orders found`}
        primaryAction={{
          content: 'Bulk Print',
          url: '/bulk-print'
        }}
      >
      <Card>
        <div style={{ padding: '16px' }}>
          <Filters
            queryValue={searchQuery}
            queryPlaceholder="Search orders..."
            filters={filters}
            onQueryChange={setSearchQuery}
            onQueryClear={() => setSearchQuery('')}
            onClearAll={handleClearFilters}
          />
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spinner size="large" />
            <Text as="p" variant="bodyMd" tone="subdued">
              Loading orders...
            </Text>
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            heading="No orders found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            action={searchQuery || statusFilter ? {
              content: 'Clear filters',
              onAction: handleClearFilters
            } : undefined}
          >
            <p>
              {searchQuery || statusFilter 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Your orders will appear here once you start receiving them.'
              }
            </p>
          </EmptyState>
        ) : (
          <>
            <DataTable
              columnContentTypes={columnContentTypes}
              headings={headings}
              rows={tableRows}
              hoverable
            />
            
            {(hasNextPage || currentPage > 1) && (
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  hasPrevious={currentPage > 1}
                  onPrevious={handlePreviousPage}
                  hasNext={hasNextPage}
                  onNext={handleNextPage}
                />
              </div>
            )}
          </>
        )}
      </Card>
      </Page>
    </Frame>
  )
}