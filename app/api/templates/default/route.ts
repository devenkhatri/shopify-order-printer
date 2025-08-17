import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { TemplateService } from '../../../../lib/services/templateService';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templateService = new TemplateService(session);
    const result = await templateService.getDefaultTemplate();

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error('Error fetching default template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templateService = new TemplateService(session);
    const result = await templateService.createDefaultTemplate();

    return NextResponse.json(result, {
      status: result.success ? 201 : 400
    });
  } catch (error) {
    console.error('Error creating default template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}