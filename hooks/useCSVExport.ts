import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

export interface CSVExportOptions {
  orderIds?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  includeGSTBreakdown?: boolean;
  groupByDate?: boolean;
  exportType?: 'detailed' | 'summary';
  groupBy?: 'date' | 'customer' | 'product';
  storeState?: string;
}

export interface CSVExportResult {
  success: boolean;
  filename?: string;
  downloadUrl?: string;
  error?: string;
}

/**
 * Hook for CSV export functionality
 */
export function useCSVExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Mutation for CSV export
  const exportMutation = useMutation({
    mutationFn: async (options: CSVExportOptions): Promise<CSVExportResult> => {
      setIsExporting(true);
      setExportProgress(0);

      try {
        const response = await fetch('/api/export/csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Export failed');
        }

        // Check if response is JSON (error) or CSV (success)
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Export failed');
        }

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('content-disposition');
        const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
        const filename = filenameMatch ? filenameMatch[1] : 'orders_export.csv';

        // Create blob and download URL
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);

        setExportProgress(100);

        return {
          success: true,
          filename,
          downloadUrl
        };

      } catch (error) {
        console.error('CSV export error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Export failed'
        };
      } finally {
        setIsExporting(false);
      }
    },
    onSuccess: (result) => {
      if (result.success && result.downloadUrl) {
        // Automatically trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename || 'orders_export.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL after a delay
        setTimeout(() => {
          if (result.downloadUrl) {
            URL.revokeObjectURL(result.downloadUrl);
          }
        }, 1000);
      }
    }
  });

  // Quick export functions
  const exportOrdersByIds = useCallback((orderIds: string[], options: Omit<CSVExportOptions, 'orderIds'> = {}) => {
    return exportMutation.mutate({
      orderIds,
      includeGSTBreakdown: true,
      ...options
    });
  }, [exportMutation]);

  const exportOrdersByDateRange = useCallback((
    dateRange: { from: string; to: string }, 
    options: Omit<CSVExportOptions, 'dateRange'> = {}
  ) => {
    return exportMutation.mutate({
      dateRange,
      includeGSTBreakdown: true,
      groupByDate: true,
      ...options
    });
  }, [exportMutation]);

  const exportSummary = useCallback((
    orders: string[] | { from: string; to: string },
    groupBy: 'date' | 'customer' | 'product' = 'date',
    options: Omit<CSVExportOptions, 'orderIds' | 'dateRange' | 'exportType' | 'groupBy'> = {}
  ) => {
    const baseOptions = {
      exportType: 'summary' as const,
      groupBy,
      includeGSTBreakdown: true,
      ...options
    };

    if (Array.isArray(orders)) {
      return exportMutation.mutate({
        orderIds: orders,
        ...baseOptions
      });
    } else {
      return exportMutation.mutate({
        dateRange: orders,
        ...baseOptions
      });
    }
  }, [exportMutation]);

  // Validation function
  const validateExportOptions = useCallback((options: CSVExportOptions): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!options.orderIds && !options.dateRange) {
      errors.push('Either orderIds or dateRange must be provided');
    }

    if (options.orderIds && options.orderIds.length === 0) {
      errors.push('At least one order ID must be provided');
    }

    if (options.orderIds && options.orderIds.length > 1000) {
      errors.push('Maximum 1000 orders allowed per export');
    }

    if (options.dateRange) {
      const { from, to } = options.dateRange;
      if (!from || !to) {
        errors.push('Both from and to dates are required for date range export');
      } else {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        
        if (fromDate > toDate) {
          errors.push('From date must be before to date');
        }

        const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 365) {
          errors.push('Date range cannot exceed 365 days');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Get export status
  const getExportStatus = useCallback(() => {
    return {
      isExporting,
      progress: exportProgress,
      isSuccess: exportMutation.isSuccess,
      isError: exportMutation.isError,
      error: exportMutation.error?.message || null,
      result: exportMutation.data || null
    };
  }, [isExporting, exportProgress, exportMutation]);

  // Reset export state
  const resetExport = useCallback(() => {
    setIsExporting(false);
    setExportProgress(0);
    exportMutation.reset();
  }, [exportMutation]);

  return {
    // Main export function
    exportCSV: exportMutation.mutate,
    
    // Quick export functions
    exportOrdersByIds,
    exportOrdersByDateRange,
    exportSummary,
    
    // Utility functions
    validateExportOptions,
    getExportStatus,
    resetExport,
    
    // State
    isExporting,
    exportProgress,
    isSuccess: exportMutation.isSuccess,
    isError: exportMutation.isError,
    error: exportMutation.error?.message || null,
    result: exportMutation.data || null
  };
}

/**
 * Hook for getting CSV export templates/presets
 */
export function useCSVExportTemplates() {
  const templates = [
    {
      id: 'detailed_with_gst',
      name: 'Detailed Export with GST',
      description: 'Complete order details with GST breakdown for each line item',
      options: {
        includeGSTBreakdown: true,
        exportType: 'detailed' as const,
        groupByDate: false
      }
    },
    {
      id: 'detailed_grouped_by_date',
      name: 'Detailed Export (Grouped by Date)',
      description: 'Complete order details grouped by order date',
      options: {
        includeGSTBreakdown: true,
        exportType: 'detailed' as const,
        groupByDate: true
      }
    },
    {
      id: 'summary_by_date',
      name: 'Daily Summary',
      description: 'Aggregated data grouped by date',
      options: {
        includeGSTBreakdown: true,
        exportType: 'summary' as const,
        groupBy: 'date' as const
      }
    },
    {
      id: 'summary_by_customer',
      name: 'Customer Summary',
      description: 'Aggregated data grouped by customer',
      options: {
        includeGSTBreakdown: true,
        exportType: 'summary' as const,
        groupBy: 'customer' as const
      }
    },
    {
      id: 'summary_by_product',
      name: 'Product Summary',
      description: 'Aggregated data grouped by product',
      options: {
        includeGSTBreakdown: true,
        exportType: 'summary' as const,
        groupBy: 'product' as const
      }
    },
    {
      id: 'basic_without_gst',
      name: 'Basic Export (No GST)',
      description: 'Basic order information without GST calculations',
      options: {
        includeGSTBreakdown: false,
        exportType: 'detailed' as const,
        groupByDate: false
      }
    }
  ];

  return {
    templates,
    getTemplate: (id: string) => templates.find(t => t.id === id),
    getTemplateOptions: (id: string) => templates.find(t => t.id === id)?.options
  };
}