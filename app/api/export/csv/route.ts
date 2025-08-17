import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getOrdersByDateRange, getOrdersByIds } from '@/lib/services/orderService';
import { csvExportService } from '@/lib/services/csvExportService';
import { gstService } from '@/lib/services/gstService';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      orderIds, 
      dateRange, 
      includeGSTBreakdown = true, 
      groupByDate = false,
      exportType = 'detailed', // 'detailed' | 'summary'
      groupBy = 'date', // For summary exports: 'date' | 'customer' | 'product'
      storeState 
    } = body;

    // Set store state for GST calculations if provided
    if (storeState) {
      csvExportService.setStoreState(storeState);
    }

    let orders;

    // Fetch orders based on provided criteria
    if (orderIds && orderIds.length > 0) {
      // Export specific orders
      if (orderIds.length > 1000) {
        return NextResponse.json({ 
          error: 'Maximum 1000 orders allowed per export' 
        }, { status: 400 });
      }
      
      orders = await getOrdersByIds(session, orderIds);
    } else if (dateRange && dateRange.from && dateRange.to) {
      // Export orders by date range
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      
      // Validate date range
      if (fromDate > toDate) {
        return NextResponse.json({ 
          error: 'Invalid date range: from date must be before to date' 
        }, { status: 400 });
      }

      // Limit date range to prevent excessive exports
      const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        return NextResponse.json({ 
          error: 'Date range cannot exceed 365 days' 
        }, { status: 400 });
      }

      orders = await getOrdersByDateRange(session, dateRange.from, dateRange.to);
    } else {
      return NextResponse.json({ 
        error: 'Either orderIds or dateRange must be provided' 
      }, { status: 400 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ 
        error: 'No orders found for the specified criteria' 
      }, { status: 404 });
    }

    // Validate orders for export
    const validation = csvExportService.validateOrdersForExport(orders);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Order validation failed',
        details: validation.errors 
      }, { status: 400 });
    }

    // Generate CSV based on export type
    let csvResult;
    
    if (exportType === 'summary') {
      csvResult = await csvExportService.generateSummaryCSV(orders, {
        groupBy,
        includeGSTBreakdown
      });
    } else if (dateRange) {
      csvResult = await csvExportService.generateDateRangeCSV(orders, dateRange, {
        includeGSTBreakdown,
        groupByDate
      });
    } else {
      csvResult = await csvExportService.generateCSVFile(orders, {
        includeGSTBreakdown,
        groupByDate
      });
    }

    // Return CSV content with appropriate headers
    const response = new NextResponse(csvResult.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${csvResult.filename}"`,
        'Content-Length': Buffer.byteLength(csvResult.content, 'utf8').toString()
      }
    });

    return response;

  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate CSV export',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderIds = searchParams.get('orderIds')?.split(',') || [];
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const includeGSTBreakdown = searchParams.get('includeGST') !== 'false';
    const groupByDate = searchParams.get('groupByDate') === 'true';
    const storeState = searchParams.get('storeState');

    // Set store state for GST calculations if provided
    if (storeState) {
      csvExportService.setStoreState(storeState);
    }

    let orders;

    if (orderIds.length > 0) {
      if (orderIds.length > 100) {
        return NextResponse.json({ 
          error: 'Maximum 100 orders allowed per GET request. Use POST for larger exports.' 
        }, { status: 400 });
      }
      
      orders = await getOrdersByIds(session, orderIds);
    } else if (dateFrom && dateTo) {
      orders = await getOrdersByDateRange(session, dateFrom, dateTo);
    } else {
      return NextResponse.json({ 
        error: 'Either orderIds or date range (dateFrom, dateTo) must be provided' 
      }, { status: 400 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ 
        error: 'No orders found for the specified criteria' 
      }, { status: 404 });
    }

    // Generate CSV
    const csvResult = await csvExportService.generateCSVFile(orders, {
      includeGSTBreakdown,
      groupByDate
    });

    // Return CSV content
    return new NextResponse(csvResult.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${csvResult.filename}"`,
        'Content-Length': Buffer.byteLength(csvResult.content, 'utf8').toString()
      }
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate CSV export',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}