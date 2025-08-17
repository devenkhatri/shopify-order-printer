import { NextRequest, NextResponse } from 'next/server';
import { FileStorageService } from '../../../../../lib/services/fileStorageService';
import { getSession } from '../../../../../lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileKey: string } }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { fileKey } = params;

    if (!fileKey) {
      return NextResponse.json(
        { success: false, error: 'File key is required' },
        { status: 400 }
      );
    }

    // Initialize file storage service
    const fileStorageService = new FileStorageService(session);

    // Get file buffer
    const fileResult = await fileStorageService.getFileBuffer(fileKey);

    if (!fileResult.success) {
      const status = fileResult.error === 'File not found' ? 404 : 
                    fileResult.error === 'File has expired' ? 410 : 500;
      
      return NextResponse.json(
        { success: false, error: fileResult.error },
        { status }
      );
    }

    // Return file as response
    return new NextResponse(fileResult.buffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': fileResult.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileResult.filename}"`,
        'Content-Length': fileResult.buffer!.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileKey: string } }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { fileKey } = params;

    if (!fileKey) {
      return NextResponse.json(
        { success: false, error: 'File key is required' },
        { status: 400 }
      );
    }

    // Initialize file storage service
    const fileStorageService = new FileStorageService(session);

    // Delete file
    const deleteResult = await fileStorageService.deleteFile(fileKey);

    if (!deleteResult.success) {
      const status = deleteResult.error === 'File not found' ? 404 : 500;
      
      return NextResponse.json(
        { success: false, error: deleteResult.error },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}