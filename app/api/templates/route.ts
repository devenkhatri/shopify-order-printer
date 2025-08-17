import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { TemplateService } from '../../../lib/services/templateService';
import { Template } from '../../../types/shopify';

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
    const result = await templateService.getTemplates();

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
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

    const templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'> = await request.json();
    
    // Basic validation
    if (!templateData.name || !templateData.layout || !templateData.businessInfo) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, layout, and businessInfo are required' 
        },
        { status: 400 }
      );
    }

    const templateService = new TemplateService(session);
    const result = await templateService.createTemplate(templateData);

    return NextResponse.json(result, {
      status: result.success ? 201 : 400
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}