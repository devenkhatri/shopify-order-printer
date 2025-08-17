import { NextRequest, NextResponse } from 'next/server'
import { shopify } from '@/lib/shopify'
import { getOrdersWithGST } from '@/lib/services/orderService'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const cursor = url.searchParams.get('cursor')
    const status = url.searchParams.get('status')
    
    // Get session from request
    const session = await shopify.session.getCurrentSession(request, NextResponse)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await getOrdersWithGST(session, {
      limit,
      cursor,
      status,
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}