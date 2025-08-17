import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getGeneratedFile } from '@/lib/services/bulkPrintService'

export async function GET(
  request: NextRequest,
  { params }: { params: { fileKey: string } }
) {
  try {
    const session = await getSessionFromRequest(request)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileKey } = params

    if (!fileKey) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 })
    }

    const file = await getGeneratedFile(fileKey)

    if (!file) {
      return NextResponse.json({ error: 'File not found or expired' }, { status: 404 })
    }

    // Determine content type based on file extension
    let contentType = file.contentType
    if (!contentType) {
      if (fileKey.endsWith('.pdf')) {
        contentType = 'application/pdf'
      } else if (fileKey.endsWith('.csv')) {
        contentType = 'text/csv'
      } else {
        contentType = 'application/octet-stream'
      }
    }

    // Convert content to buffer if it's a string
    const content = typeof file.content === 'string' 
      ? Buffer.from(file.content, 'utf-8')
      : file.content

    // Set appropriate headers for file download
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': content.length.toString(),
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Expires': '0',
      'Pragma': 'no-cache'
    })

    return new NextResponse(content, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Download file error:', error)
    return NextResponse.json({ 
      error: 'Failed to download file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}