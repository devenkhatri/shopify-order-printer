import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getBulkPrintJob, deleteBulkPrintJob } from '@/lib/services/bulkPrintService'

export async function GET(
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

    return NextResponse.json(job)
  } catch (error) {
    console.error('Get job status error:', error)
    return NextResponse.json({ 
      error: 'Failed to get job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
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

    // Only allow deletion of completed or failed jobs
    if (job.status === 'processing' || job.status === 'pending') {
      return NextResponse.json({ 
        error: 'Cannot delete job that is still processing' 
      }, { status: 400 })
    }

    await deleteBulkPrintJob(jobId)

    return NextResponse.json({ 
      success: true,
      message: 'Job deleted successfully' 
    })
  } catch (error) {
    console.error('Delete job error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}