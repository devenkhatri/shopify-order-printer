'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Page,
  Card,
  Layout,
  Button,
  ButtonGroup,
  Text,
  DatePicker,
  Popover,
  DataTable,
  Checkbox,
  ProgressBar,
  Banner,
  Toast,
  Frame,
  Badge,
  InlineStack,
  BlockStack,
  Filters,
  ChoiceList,
  RangeSlider,
  EmptyState,
  Spinner,
  Modal,

} from '@shopify/polaris'
import { CalendarIcon, ExportIcon, PrintIcon } from '@shopify/polaris-icons'
import { useOrders } from '@/hooks/useOrders'
import { usePrint } from '@/hooks/usePrint'
import { useBulkPrint, useDateRangeFilter } from '@/hooks/useBulkPrint'
import { OrderWithGST, BulkPrintJob, BulkPrintRequest } from '@/types/shopify'
import { CSVExportDialog } from '@/components/export/CSVExportDialog'



interface BulkPrintFilters {
  status: string[]
  fulfillmentStatus: string[]
  totalRange: [number, number]
  searchQuery: string
}

export function BulkPrintInterface() {
  // Date range management
  const { dateRange, setDateRange, formatDateRange, setPresetRange } = useDateRangeFilter()
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // State for order selection and filtering
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [filteredOrders, setFilteredOrders] = useState<OrderWithGST[]>([])
  const [filters, setFilters] = useState<BulkPrintFilters>({
    status: [],
    fulfillmentStatus: [],
    totalRange: [0, 10000],
    searchQuery: ''
  })

  // State for bulk operations
  const [bulkJob, setBulkJob] = useState<BulkPrintJob | null>(null)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showCSVExportDialog, setShowCSVExportDialog] = useState(false)
  const [toastActive, setToastActive] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastError, setToastError] = useState(false)

  // Hooks
  const { orders, loading: ordersLoading, error: ordersError, fetchOrders } = useOrders({
    autoFetch: false
  })
  const { loading: printLoading } = usePrint()
  const { startBulkPrint } = useBulkPrint()

  // Fetch orders when date range changes
  useEffect(() => {
    const fetchOrdersInRange = async () => {
      try {
        // In a real implementation, you'd pass date range to the API
        await fetchOrders(true)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      }
    }

    fetchOrdersInRange()
  }, [dateRange, fetchOrders])

  // Filter orders based on current filters
  useEffect(() => {
    let filtered = orders.filter(order => {
      const orderDate = new Date(order.created_at)
      const inDateRange = orderDate >= dateRange.start && orderDate <= dateRange.end

      if (!inDateRange) return false

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(order.financial_status)) {
        return false
      }

      // Fulfillment status filter
      if (filters.fulfillmentStatus.length > 0) {
        const fulfillmentStatus = order.fulfillment_status || 'unfulfilled'
        if (!filters.fulfillmentStatus.includes(fulfillmentStatus)) {
          return false
        }
      }

      // Total amount range filter
      const total = parseFloat(order.total_price)
      if (total < filters.totalRange[0] || total > filters.totalRange[1]) {
        return false
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const searchableText = [
          order.name,
          order.email,
          order.customer?.first_name,
          order.customer?.last_name,
          order.customer?.email
        ].filter(Boolean).join(' ').toLowerCase()

        if (!searchableText.includes(query)) {
          return false
        }
      }

      return true
    })

    setFilteredOrders(filtered)
  }, [orders, dateRange, filters])

  // Date picker handlers
  const handleDateRangeChange = useCallback((range: { start: Date; end: Date }) => {
    setDateRange(range)
  }, [setDateRange])

  // Order selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)))
    } else {
      setSelectedOrders(new Set())
    }
  }, [filteredOrders])

  const handleSelectOrder = useCallback((orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders)
    if (checked) {
      newSelected.add(orderId)
    } else {
      newSelected.delete(orderId)
    }
    setSelectedOrders(newSelected)
  }, [selectedOrders])

  // Filter handlers
  const handleFiltersChange = useCallback((newFilters: Partial<BulkPrintFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, searchQuery: value }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({
      status: [],
      fulfillmentStatus: [],
      totalRange: [0, 10000],
      searchQuery: ''
    })
  }, [])

  // Bulk print handlers
  const handleBulkPrint = useCallback(async (format: 'pdf' | 'csv') => {
    if (selectedOrders.size === 0) {
      setToastMessage('Please select at least one order to print')
      setToastError(true)
      setToastActive(true)
      return
    }

    // For CSV exports, show the advanced export dialog
    if (format === 'csv') {
      setShowCSVExportDialog(true)
      return
    }

    try {
      setShowProgressModal(true)
      const orderIds = Array.from(selectedOrders)

      const request: BulkPrintRequest = {
        dateRange: {
          from: dateRange.start.toISOString(),
          to: dateRange.end.toISOString()
        },
        orderIds,
        format,
        includeGSTBreakdown: true,
        groupByDate: false
      }

      const job = await startBulkPrint(request)
      setBulkJob(job)

      setToastMessage(`${format.toUpperCase()} generation started for ${orderIds.length} orders`)
      setToastError(false)
      setToastActive(true)
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Failed to start bulk print')
      setToastError(true)
      setToastActive(true)
      setShowProgressModal(false)
    }
  }, [selectedOrders, startBulkPrint, dateRange])

  // CSV export handlers
  const handleCSVExport = useCallback(() => {
    if (selectedOrders.size === 0) {
      setToastMessage('Please select at least one order to export')
      setToastError(true)
      setToastActive(true)
      return
    }
    setShowCSVExportDialog(true)
  }, [selectedOrders])

  const handleCSVExportClose = useCallback(() => {
    setShowCSVExportDialog(false)
  }, [])

  // Create data table rows
  const tableRows = filteredOrders.map(order => {
    const isSelected = selectedOrders.has(order.id)
    const customerName = order.customer
      ? `${order.customer.first_name} ${order.customer.last_name}`.trim()
      : 'Guest'

    return [
      <Checkbox
        key={`checkbox-${order.id}`}
        checked={isSelected}
        onChange={(checked) => handleSelectOrder(order.id, checked)} label={undefined}      />,
      order.name,
      customerName,
      new Date(order.created_at).toLocaleDateString('en-IN'),
      <Badge key={`status-${order.id}`} tone={order.financial_status === 'paid' ? 'success' : 'warning'}>
        {order.financial_status}
      </Badge>,
      <Badge key={`fulfillment-${order.id}`} tone={order.fulfillment_status ? 'success' : 'attention'}>
        {order.fulfillment_status || 'unfulfilled'}
      </Badge>,
      `₹${parseFloat(order.total_price).toFixed(2)}`,
      order.gstBreakdown ? `₹${order.gstBreakdown.totalGstAmount.toFixed(2)}` : 'N/A'
    ]
  })

  const tableHeadings = [
    <Checkbox
      key="select-all"
      checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
      onChange={handleSelectAll}
      label=""
    />,
    'Order',
    'Customer',
    'Date',
    'Payment Status',
    'Fulfillment',
    'Total',
    'GST Amount'
  ]

  // Filter options
  const statusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Authorized', value: 'authorized' },
    { label: 'Partially Paid', value: 'partially_paid' },
    { label: 'Refunded', value: 'refunded' },
    { label: 'Voided', value: 'voided' }
  ]

  const fulfillmentOptions = [
    { label: 'Fulfilled', value: 'fulfilled' },
    { label: 'Partial', value: 'partial' },
    { label: 'Unfulfilled', value: 'unfulfilled' }
  ]

  const appliedFilters: Array<{
    key: string
    label: string
    onRemove: () => void
  }> = []

  if (filters.status.length > 0) {
    appliedFilters.push({
      key: 'status',
      label: `Payment Status: ${filters.status.join(', ')}`,
      onRemove: () => handleFiltersChange({ status: [] })
    })
  }
  if (filters.fulfillmentStatus.length > 0) {
    appliedFilters.push({
      key: 'fulfillmentStatus',
      label: `Fulfillment: ${filters.fulfillmentStatus.join(', ')}`,
      onRemove: () => handleFiltersChange({ fulfillmentStatus: [] })
    })
  }
  if (filters.totalRange[0] > 0 || filters.totalRange[1] < 10000) {
    appliedFilters.push({
      key: 'totalRange',
      label: `Total: ₹${filters.totalRange[0]} - ₹${filters.totalRange[1]}`,
      onRemove: () => handleFiltersChange({ totalRange: [0, 10000] })
    })
  }

  const filterMarkup = (
    <Filters
      queryValue={filters.searchQuery}
      filters={[
        {
          key: 'status',
          label: 'Payment Status',
          filter: (
            <ChoiceList
              title="Payment Status"
              titleHidden
              choices={statusOptions}
              selected={filters.status}
              onChange={(value) => handleFiltersChange({ status: value })}
              allowMultiple
            />
          ),
          shortcut: true
        },
        {
          key: 'fulfillmentStatus',
          label: 'Fulfillment Status',
          filter: (
            <ChoiceList
              title="Fulfillment Status"
              titleHidden
              choices={fulfillmentOptions}
              selected={filters.fulfillmentStatus}
              onChange={(value) => handleFiltersChange({ fulfillmentStatus: value })}
              allowMultiple
            />
          ),
          shortcut: true
        },
        {
          key: 'totalRange',
          label: 'Order Total',
          filter: (
            <Card>
              <RangeSlider
                label="Order Total Range"
                value={filters.totalRange}
                onChange={(value) => handleFiltersChange({ totalRange: value as [number, number] })}
                output
                min={0}
                max={10000}
                step={100}
                prefix="₹"
              />
            </Card>
          )
        }
      ]}
      appliedFilters={appliedFilters}
      onQueryChange={handleSearchChange}
      onQueryClear={() => handleSearchChange('')}
      onClearAll={clearAllFilters}
    />
  )

  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastActive(false)}
    />
  ) : null

  const progressModal = showProgressModal && bulkJob ? (
    <Modal
      open={showProgressModal}
      onClose={() => setShowProgressModal(false)}
      title="Bulk Print Progress"
      primaryAction={{
        content: 'Close',
        onAction: () => setShowProgressModal(false),
        disabled: bulkJob.status === 'processing'
      }}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text as="p">
            Processing {bulkJob.totalOrders} orders...
          </Text>
          <ProgressBar
            progress={bulkJob.progress}
            size="large"
          />
          <Text as="p" tone="subdued">
            {bulkJob.processedOrders} of {bulkJob.totalOrders} orders processed
          </Text>
          {bulkJob.status === 'completed' && bulkJob.downloadUrl && (
            <Button
              variant="primary"
              url={bulkJob.downloadUrl}
              target="_blank"
              icon={ExportIcon}
            >
              Download {bulkJob.format.toUpperCase()}
            </Button>
          )}
          {bulkJob.status === 'failed' && (
            <Banner tone="critical" title="Export Failed">
              <p>{bulkJob.error || 'An error occurred during export'}</p>
            </Banner>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  ) : null

  return (
    <Frame>
      <Page
        title="Bulk Print Orders"
        subtitle={`${selectedOrders.size} of ${filteredOrders.length} orders selected`}
        primaryAction={{
          content: 'Print PDF',
          icon: PrintIcon,
          onAction: () => handleBulkPrint('pdf'),
          disabled: selectedOrders.size === 0 || printLoading
        }}
        secondaryActions={[
          {
            content: 'Export CSV',
            icon: ExportIcon,
            onAction: handleCSVExport,
            disabled: selectedOrders.size === 0 || printLoading
          }
        ]}
      >
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Date Range</Text>
                <InlineStack gap="200">
                  <Popover
                    active={datePickerOpen}
                    activator={
                      <Button
                        icon={CalendarIcon}
                        onClick={() => setDatePickerOpen(!datePickerOpen)}
                      >
                        {formatDateRange()}
                      </Button>
                    }
                    onClose={() => setDatePickerOpen(false)}
                  >
                    <Card>
                      <DatePicker
                        month={dateRange.start.getMonth()}
                        year={dateRange.start.getFullYear()}
                        selected={{
                          start: dateRange.start,
                          end: dateRange.end
                        }}
                        onMonthChange={(month, year) => {
                          const newStart = new Date(year, month, 1)
                          const newEnd = dateRange.end < newStart ? newStart : dateRange.end
                          setDateRange({ start: newStart, end: newEnd })
                        }}
                        onChange={handleDateRangeChange}
                        allowRange
                      />
                    </Card>
                  </Popover>
                </InlineStack>
                <InlineStack gap="200">
                  <ButtonGroup variant="segmented">
                    <Button size="micro" onClick={() => setPresetRange('today')}>Today</Button>
                    <Button size="micro" onClick={() => setPresetRange('yesterday')}>Yesterday</Button>
                    <Button size="micro" onClick={() => setPresetRange('last7days')}>Last 7 days</Button>
                    <Button size="micro" onClick={() => setPresetRange('last30days')}>Last 30 days</Button>
                    <Button size="micro" onClick={() => setPresetRange('thisMonth')}>This month</Button>
                  </ButtonGroup>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                {ordersError && (
                  <Banner tone="critical" title="Error loading orders">
                    <p>{ordersError}</p>
                  </Banner>
                )}

                {filterMarkup}

                {ordersLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Spinner size="large" />
                    <Text as="p" tone="subdued">Loading orders...</Text>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <EmptyState
                    heading="No orders found"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Try adjusting your date range or filters to find orders.</p>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={[
                      'text',
                      'text',
                      'text',
                      'text',
                      'text',
                      'text',
                      'numeric',
                      'numeric'
                    ]}
                    headings={tableHeadings}
                    rows={tableRows}
                    footerContent={`Showing ${filteredOrders.length} orders`}
                  />
                )}
              </BlockStack>
            </Card>
          </Layout.Section>

          {selectedOrders.size > 0 && (
            <Layout.Section>
              <Card>
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingMd">
                    {selectedOrders.size} orders selected
                  </Text>
                  <ButtonGroup>
                    <Button
                      variant="primary"
                      icon={PrintIcon}
                      onClick={() => handleBulkPrint('pdf')}
                      loading={printLoading}
                    >
                      Generate PDF
                    </Button>
                    <Button
                      icon={ExportIcon}
                      onClick={handleCSVExport}
                      loading={printLoading}
                    >
                      Export CSV
                    </Button>
                  </ButtonGroup>
                </InlineStack>
              </Card>
            </Layout.Section>
          )}
        </Layout>
      </Page>
      {toastMarkup}
      {progressModal}
      
      {/* CSV Export Dialog */}
      <CSVExportDialog
        isOpen={showCSVExportDialog}
        onClose={handleCSVExportClose}
        orderIds={Array.from(selectedOrders)}
        dateRange={{
          from: dateRange.start.toISOString().split('T')[0],
          to: dateRange.end.toISOString().split('T')[0]
        }}
        defaultStoreState="MH"
      />
    </Frame>
  )
}