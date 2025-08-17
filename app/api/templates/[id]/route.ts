import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { TemplateService } from '../../../../lib/services/templateService';
import { Template } from '../../../../types/shopify';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templateService = new TemplateService(session);
    const result = await templateService.getTemplate(params.id);

    return NextResponse.json(result, {
      status: result.success ? 200 : 404
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updates: Partial<Template> = await request.json();
    
    // Prevent ID changes
    if (updates.id && updates.id !== params.id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Template ID cannot be changed' 
        },
        { status: 400 }
      );
    }

    const templateService = new TemplateService(session);
    const result = await templateService.updateTemplate(params.id, updates);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templateService = new TemplateService(session);
    const result = await templateService.deleteTemplate(params.id);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}