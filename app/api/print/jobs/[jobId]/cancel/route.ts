import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getBulkPrintJob, updateBulkPrintJob } from '@/lib/services/bulkPrintService'

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId } = params

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const job = await getBulkPrintJob(jobId)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Only allow cancellation of pending or processing jobs
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json({ 
        error: `Cannot cancel job with status: ${job.status}` 
      }, { status: 400 })
    }

    // Update job status to failed with cancellation message
    await updateBulkPrintJob(jobId, {
      status: 'failed',
      error: 'Job cancelled by user',
      completedAt: new Date().toISOString()
    })

    return NextResponse.json({ 
      success: true,
      message: 'Job cancelled successfully' 
    })
  } catch (error) {
    console.error('Cancel job error:', error)
    return NextResponse.json({ 
      error: 'Failed to cancel job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}