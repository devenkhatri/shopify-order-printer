import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getOrderById } from '@/lib/services/orderService'

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, format = 'pdf', templateId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get order with GST breakdown
    const order = await getOrderById(session, orderId)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // For now, return a mock response since PDF generation will be implemented in task 10
    // This provides the structure for the print functionality
    const printJob = {
      id: `print_${Date.now()}`,
      orderId: order.id,
      orderName: order.name,
      format,
      templateId,
      status: 'completed',
      downloadUrl: `/api/print/download/${orderId}?format=${format}`,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      printJob,
      message: `Order ${order.name} queued for ${format.toUpperCase()} printing`
    })
  } catch (error) {
    console.error('Print order error:', error)
    return NextResponse.json({ 
      error: 'Failed to print order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}