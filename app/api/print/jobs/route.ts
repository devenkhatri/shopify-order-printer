import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getBulkPrintJobsByShop } from '@/lib/services/bulkPrintService'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobs = await getBulkPrintJobsByShop(session.shop)

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length
    })
  } catch (error) {
    console.error('Get jobs error:', error)
    return NextResponse.json({ 
      error: 'Failed to get jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}