import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { TemplateService } from '../../../lib/services/templateService';
import { BusinessInfo } from '../../../types/shopify';

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
    const result = await templateService.getBusinessInfo();

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error('Error fetching business info:', error);
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

    const businessInfo: BusinessInfo = await request.json();
    
    // Basic validation
    if (!businessInfo.companyName || !businessInfo.gstin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Company name and GSTIN are required' 
        },
        { status: 400 }
      );
    }

    // Validate GSTIN format (basic validation)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(businessInfo.gstin)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid GSTIN format' 
        },
        { status: 400 }
      );
    }

    const templateService = new TemplateService(session);
    const result = await templateService.saveBusinessInfo(businessInfo);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });
  } catch (error) {
    console.error('Error saving business info:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}