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

// Function to generate CSV data for an order
async function generateOrderCSVData(order: any, includeGSTBreakdown: boolean) {
  const { formatOrderForCSV } = await import('@/lib/services/bulkPrintService')
  
  // Use the utility function for basic order data
  const orderData = formatOrderForCSV(order, includeGSTBreakdown)
  
  // Create detailed rows for each line item
  const csvRows = []
  
  for (const lineItem of order.line_items) {
    const row = {
      ...orderData,
      productName: lineItem.name,
      variant: lineItem.variant_title || '',
      sku: lineItem.sku || '',
      quantity: lineItem.quantity,
      unitPrice: parseFloat(lineItem.price),
      lineTotal: parseFloat(lineItem.price) * lineItem.quantity,
      vendor: lineItem.vendor || '',
      productType: lineItem.product?.productType || '',
      fulfillmentStatus: lineItem.fulfillment_status || 'unfulfilled',
      taxable: lineItem.taxable ? 'Yes' : 'No',
      requiresShipping: lineItem.requires_shipping ? 'Yes' : 'No'
    }

    csvRows.push(row)
  }

  return csvRows
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

// Function to generate CSV file from data
async function generateCSVFile(csvData: any[], jobId: string, groupByDate: boolean): Promise<string> {
  const { generateCSVContent, storeGeneratedFile } = await import('@/lib/services/bulkPrintService')
  
  // Flatten all CSV rows
  const allRows = csvData.flat()
  
  if (groupByDate) {
    // Sort by order date
    allRows.sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime())
  }

  // Generate CSV content
  const csvContent = generateCSVContent(allRows)
  
  // Store the file and get download URL
  const filename = `bulk_orders_${jobId}.csv`
  const downloadUrl = await storeGeneratedFile(jobId, filename, csvContent, 'text/csv')
  
  return downloadUrl
}