import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getOrdersByIds } from '@/lib/services/orderService'
import { BulkPrintRequest, BulkPrintJob } from '@/types/shopify'
import { createBulkPrintJob, updateBulkPrintJob } from '@/lib/services/bulkPrintService'

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: BulkPrintRequest = await request.json()
    const { orderIds, format = 'pdf', templateId, includeGSTBreakdown = true, groupByDate = false } = body

    if (!orderIds || orderIds.length === 0) {
      return NextResponse.json({ error: 'Order IDs are required' }, { status: 400 })
    }

    if (orderIds.length > 100) {
      return NextResponse.json({ error: 'Maximum 100 orders allowed per bulk operation' }, { status: 400 })
    }

    // Validate that orders exist
    const orders = await getOrdersByIds(session, orderIds)
    
    if (orders.length === 0) {
      return NextResponse.json({ error: 'No valid orders found' }, { status: 404 })
    }

    if (orders.length !== orderIds.length) {
      return NextResponse.json({ 
        error: `Only ${orders.length} of ${orderIds.length} orders found`,
        foundOrders: orders.length
      }, { status: 400 })
    }

    // Create bulk print job
    const job: BulkPrintJob = {
      id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0,
      totalOrders: orders.length,
      processedOrders: 0,
      format,
      createdAt: new Date().toISOString()
    }

    // Store job in database/memory (for now using in-memory storage)
    await createBulkPrintJob(job, {
      orderIds,
      templateId,
      includeGSTBreakdown,
      groupByDate,
      shopDomain: session.shop
    })

    // Start processing job asynchronously
    processBulkPrintJob(job.id, session, orders, {
      format,
      templateId,
      includeGSTBreakdown,
      groupByDate
    }).catch(error => {
      console.error(`Bulk print job ${job.id} failed:`, error)
    })

    return NextResponse.json({
      success: true,
      job,
      message: `Bulk ${format.toUpperCase()} generation started for ${orders.length} orders`
    })
  } catch (error) {
    console.error('Bulk print error:', error)
    return NextResponse.json({ 
      error: 'Failed to start bulk print job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Async function to process bulk print job
async function processBulkPrintJob(
  jobId: string,
  session: any,
  orders: any[],
  options: {
    format: 'pdf' | 'csv'
    templateId?: string
    includeGSTBreakdown: boolean
    groupByDate: boolean
  }
) {
  try {
    // Update job status to processing
    await updateBulkPrintJob(jobId, {
      status: 'processing',
      progress: 0
    })

    const { format, includeGSTBreakdown, groupByDate } = options
    let processedOrders = 0
    const results: any[] = []

    // Process orders in batches to avoid memory issues
    const batchSize = 10
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize)
      
      for (const order of batch) {
        try {
          if (format === 'pdf') {
            // Generate PDF for order (placeholder - actual PDF generation in task 10)
            const pdfResult = await generateOrderPDF(order, options)
            results.push(pdfResult)
          } else if (format === 'csv') {
            // Generate CSV data for order
            const csvData = await generateOrderCSVData(order, includeGSTBreakdown)
            results.push(csvData)
          }

          processedOrders++
          
          // Update progress
          const progress = Math.round((processedOrders / orders.length) * 100)
          await updateBulkPrintJob(jobId, {
            progress,
            processedOrders
          })
        } catch (orderError) {
          console.error(`Failed to process order ${order.id}:`, orderError)
          // Continue with other orders
        }
      }

      // Small delay between batches to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Generate final output file
    let downloadUrl: string
    if (format === 'pdf') {
      downloadUrl = await combinePDFs(results, jobId)
    } else {
      downloadUrl = await generateCSVFile(results, jobId, groupByDate)
    }

    // Mark job as completed
    await updateBulkPrintJob(jobId, {
      status: 'completed',
      progress: 100,
      processedOrders: orders.length,
      downloadUrl,
      completedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })

  } catch (error) {
    console.error(`Bulk print job ${jobId} processing failed:`, error)
    
    await updateBulkPrintJob(jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Processing failed'
    })
  }
}

// Placeholder function for PDF generation (will be implemented in task 10)
async function generateOrderPDF(order: any, options: any): Promise<Buffer> {
  // This is a placeholder - actual PDF generation will be implemented in task 10
  return Buffer.from(`PDF content for order ${order.name}`)
}

// Function to generate CSV data for an order using the dedicated CSV service
async function generateOrderCSVData(order: any, includeGSTBreakdown: boolean) {
  const { csvExportService } = await import('@/lib/services/csvExportService')
  
  // Use the dedicated CSV export service
  return await csvExportService.generateOrderCSVData(order, includeGSTBreakdown)
}

// Function to combine multiple PDFs into one
async function combinePDFs(pdfBuffers: Buffer[], jobId: string): Promise<string> {
  const { storeGeneratedFile } = await import('@/lib/services/bulkPrintService')
  
  // This is a placeholder - actual PDF combination will be implemented in task 10
  const combinedBuffer = Buffer.concat(pdfBuffers)
  
  // Store the file and get download URL
  const filename = `bulk_orders_${jobId}.pdf`
  const downloadUrl = await storeGeneratedFile(jobId, filename, combinedBuffer, 'application/pdf')
  
  return downloadUrl
}

// Function to generate CSV file from data using the dedicated CSV service
async function generateCSVFile(csvData: any[], jobId: string, groupByDate: boolean): Promise<string> {
  const { storeGeneratedFile } = await import('@/lib/services/bulkPrintService')
  
  // Flatten all CSV rows
  const allRows = csvData.flat()
  
  if (groupByDate) {
    // Sort by order date
    allRows.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime())
  }

  // Generate CSV content with proper headers for Indian business requirements
  const headers = [
    'Order Number', 'Order Date', 'Customer Name', 'Customer Email', 'Customer Phone',
    'Shipping Address', 'Billing Address', 'Product Name', 'Variant', 'Quantity',
    'Unit Price (₹)', 'Line Total (₹)', 'HSN Code', 'GST Type', 'GST Rate (%)',
    'CGST Amount (₹)', 'SGST Amount (₹)', 'IGST Amount (₹)', 'Total GST (₹)', 'Total Amount (₹)'
  ];

  const csvRows = [
    headers.join(','),
    ...allRows.map((row: any) => [
      row.orderNumber || '',
      row.orderDate || '',
      row.customerName || '',
      row.customerEmail || '',
      row.customerPhone || '',
      `"${(row.shippingAddress || '').replace(/"/g, '""')}"`,
      `"${(row.billingAddress || '').replace(/"/g, '""')}"`,
      `"${(row.productName || '').replace(/"/g, '""')}"`,
      row.variant || '',
      row.quantity || 0,
      (row.price || 0).toFixed(2),
      (row.subtotal || 0).toFixed(2),
      row.hsnCode || '',
      row.gstType || '',
      row.gstRate ? `${(row.gstRate * 100).toFixed(2)}%` : '',
      (row.cgstAmount || 0).toFixed(2),
      (row.sgstAmount || 0).toFixed(2),
      (row.igstAmount || 0).toFixed(2),
      (row.totalGstAmount || 0).toFixed(2),
      (row.totalAmount || 0).toFixed(2)
    ].join(','))
  ];

  const csvContent = csvRows.join('\n')
  
  // Store the file and get download URL
  const filename = `bulk_orders_${jobId}.csv`
  const downloadUrl = await storeGeneratedFile(jobId, filename, csvContent, 'text/csv')
  
  return downloadUrl
}