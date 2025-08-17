import { NextRequest, NextResponse } from 'next/server';
import { PDFService, PDFGenerationOptions, BulkPDFOptions } from '../../../lib/services/pdfService';
import { getOrdersByIds, getOrderById } from '../../../lib/services/orderService';
import { validateOrderForPDF } from '../../../lib/services/orderUtils';
import { getSession } from '../../../lib/session';
import { Session } from '@shopify/shopify-api';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderIds, options = {}, storeFile = false, storageOptions = {} } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order IDs are required' },
        { status: 400 }
      );
    }

    // Create Shopify Session object
    const shopifySession: Session = {
      id: `${session.shop}_session`,
      shop: session.shop,
      state: 'authenticated',
      isOnline: true,
      accessToken: session.accessToken,
      scope: 'read_orders,write_orders',
      expires: undefined,
      isActive: () => true,
      toPropertyArray: () => []
    } as unknown as Session;

    // Initialize services
    const pdfService = new PDFService(session, 'GJ'); // Default to Gujarat

    try {
      // Fetch orders using the legacy function
      const orders = await getOrdersByIds(shopifySession, orderIds);

      // Validate orders for PDF generation
      const validOrders = [];
      for (const order of orders) {
        const validation = validateOrderForPDF(order);
        if (validation.isValid) {
          validOrders.push(order);
        } else {
          console.warn(`Order ${order.id} validation failed:`, validation.errors);
        }
      }

      if (validOrders.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid orders found for PDF generation' },
          { status: 400 }
        );
      }

      // Generate PDF
      let pdfResult;
      if (storeFile) {
        // Generate and store PDF
        if (validOrders.length === 1) {
          pdfResult = await pdfService.generateAndStoreOrderPDF(validOrders[0], options as PDFGenerationOptions, storageOptions);
        } else {
          pdfResult = await pdfService.generateAndStoreBulkPDF(validOrders, options as BulkPDFOptions, storageOptions);
        }

        if (!pdfResult.success) {
          return NextResponse.json(
            { success: false, error: pdfResult.error },
            { status: 500 }
          );
        }

        // Return download URL and file info
        return NextResponse.json({
          success: true,
          downloadUrl: pdfResult.downloadUrl,
          filename: pdfResult.filename,
          fileKey: pdfResult.storedFile?.url.split('/').pop(),
          metadata: pdfResult.metadata,
          expiresAt: pdfResult.storedFile?.expiresAt
        });

      } else {
        // Generate PDF and return directly
        if (validOrders.length === 1) {
          pdfResult = await pdfService.generateOrderPDF(validOrders[0], options as PDFGenerationOptions);
        } else {
          pdfResult = await pdfService.generateBulkPDF(validOrders, options as BulkPDFOptions);
        }

        if (!pdfResult.success) {
          return NextResponse.json(
            { success: false, error: pdfResult.error },
            { status: 500 }
          );
        }

        // Return PDF as response
        return new NextResponse(pdfResult.buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${pdfResult.filename}"`,
            'Content-Length': pdfResult.buffer!.length.toString(),
          },
        });
      }

    } finally {
      // Clean up browser resources
      await pdfService.closeBrowser();
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const templateId = searchParams.get('templateId');
    const preview = searchParams.get('preview') === 'true';

    if (!orderId && !preview) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const pdfService = new PDFService(session, 'MH'); // Default to Maharashtra

    try {
      let pdfResult;

      if (preview && templateId) {
        // Generate preview PDF
        pdfResult = await pdfService.generatePreviewPDF(templateId);
      } else if (orderId) {
        // Create Shopify Session object
        const shopifySession: Session = {
          id: `${session.shop}_session`,
          shop: session.shop,
          state: 'authenticated',
          isOnline: true,
          accessToken: session.accessToken,
          scope: 'read_orders,write_orders',
          expires: undefined,
          isActive: () => true,
          toPropertyArray: () => []
        } as unknown as Session;

        // Generate single order PDF
        const order = await getOrderById(shopifySession, orderId);

        if (!order) {
          return NextResponse.json(
            { success: false, error: 'Order not found' },
            { status: 404 }
          );
        }

        // Validate order
        const validation = validateOrderForPDF(order);
        if (!validation.isValid) {
          return NextResponse.json(
            { success: false, error: `Order validation failed: ${validation.errors.join(', ')}` },
            { status: 400 }
          );
        }

        const options: PDFGenerationOptions = {
          templateId: templateId || undefined,
          includeGSTBreakdown: true,
          includeHSNCodes: true,
          includeBusinessInfo: true
        };

        pdfResult = await pdfService.generateOrderPDF(order, options);
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid request parameters' },
          { status: 400 }
        );
      }

      if (!pdfResult.success) {
        return NextResponse.json(
          { success: false, error: pdfResult.error },
          { status: 500 }
        );
      }

      // Return PDF as response
      return new NextResponse(pdfResult.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': preview
            ? `inline; filename="${pdfResult.filename}"`
            : `attachment; filename="${pdfResult.filename}"`,
          'Content-Length': pdfResult.buffer!.length.toString(),
        },
      });

    } finally {
      // Clean up browser resources
      await pdfService.closeBrowser();
    }

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}