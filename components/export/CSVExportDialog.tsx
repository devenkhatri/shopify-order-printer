'use client';

import React, { useState, useCallback } from 'react';
import {
  Modal,
  Card,
  FormLayout,
  TextField,
  Select,
  Checkbox,
  Button,
  ButtonGroup,
  Stack,
  Text,
  Banner,
  ProgressBar,
  List,
  Divider
} from '@shopify/polaris';
import { useCSVExport, useCSVExportTemplates, CSVExportOptions } from '@/hooks/useCSVExport';

interface CSVExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderIds?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  defaultStoreState?: string;
}

export function CSVExportDialog({
  isOpen,
  onClose,
  orderIds,
  dateRange,
  defaultStoreState = 'MH'
}: CSVExportDialogProps) {
  const { 
    exportCSV, 
    isExporting, 
    exportProgress, 
    isSuccess, 
    isError, 
    error, 
    validateExportOptions,
    resetExport 
  } = useCSVExport();
  
  const { templates, getTemplateOptions } = useCSVExportTemplates();

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState('detailed_with_gst');
  const [customOptions, setCustomOptions] = useState<Partial<CSVExportOptions>>({
    includeGSTBreakdown: true,
    groupByDate: false,
    exportType: 'detailed',
    groupBy: 'date',
    storeState: defaultStoreState
  });

  // Handle template selection
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    const templateOptions = getTemplateOptions(templateId);
    if (templateOptions) {
      setCustomOptions(prev => ({
        ...prev,
        ...templateOptions
      }));
    }
  }, [getTemplateOptions]);

  // Handle custom option changes
  const handleOptionChange = useCallback((key: keyof CSVExportOptions, value: any) => {
    setCustomOptions(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    const exportOptions: CSVExportOptions = {
      ...customOptions,
      orderIds,
      dateRange
    };

    const validation = validateExportOptions(exportOptions);
    if (!validation.isValid) {
      console.error('Export validation failed:', validation.errors);
      return;
    }

    exportCSV(exportOptions);
  }, [customOptions, orderIds, dateRange, validateExportOptions, exportCSV]);

  // Handle close
  const handleClose = useCallback(() => {
    resetExport();
    onClose();
  }, [resetExport, onClose]);

  // Get export summary
  const getExportSummary = () => {
    const orderCount = orderIds?.length || 0;
    const hasDateRange = dateRange?.from && dateRange?.to;
    
    if (orderCount > 0) {
      return `Exporting ${orderCount} selected orders`;
    } else if (hasDateRange) {
      return `Exporting orders from ${dateRange?.from} to ${dateRange?.to}`;
    }
    
    return 'No orders selected for export';
  };

  // Template options for select
  const templateOptions = templates.map(template => ({
    label: template.name,
    value: template.id
  }));

  // Export type options
  const exportTypeOptions = [
    { label: 'Detailed Export', value: 'detailed' },
    { label: 'Summary Export', value: 'summary' }
  ];

  // Group by options (for summary exports)
  const groupByOptions = [
    { label: 'Group by Date', value: 'date' },
    { label: 'Group by Customer', value: 'customer' },
    { label: 'Group by Product', value: 'product' }
  ];

  // Indian state options
  const stateOptions = [
    { label: 'Maharashtra (MH)', value: 'MH' },
    { label: 'Karnataka (KA)', value: 'KA' },
    { label: 'Delhi (DL)', value: 'DL' },
    { label: 'Tamil Nadu (TN)', value: 'TN' },
    { label: 'Gujarat (GJ)', value: 'GJ' },
    { label: 'Rajasthan (RJ)', value: 'RJ' },
    { label: 'Uttar Pradesh (UP)', value: 'UP' },
    { label: 'West Bengal (WB)', value: 'WB' },
    { label: 'Andhra Pradesh (AP)', value: 'AP' },
    { label: 'Telangana (TG)', value: 'TG' },
    { label: 'Kerala (KL)', value: 'KL' },
    { label: 'Punjab (PB)', value: 'PB' },
    { label: 'Haryana (HR)', value: 'HR' },
    { label: 'Bihar (BR)', value: 'BR' },
    { label: 'Odisha (OR)', value: 'OR' }
  ];

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Export Orders to CSV"
      primaryAction={{
        content: isExporting ? 'Exporting...' : 'Export CSV',
        onAction: handleExport,
        loading: isExporting,
        disabled: isExporting || (!orderIds?.length && !dateRange)
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: handleClose,
          disabled: isExporting
        }
      ]}
      large
    >
      <Modal.Section>
        <Stack vertical spacing="loose">
          {/* Export Summary */}
          <Card>
            <Card.Section>
              <Stack vertical spacing="tight">
                <Text variant="headingMd" as="h3">Export Summary</Text>
                <Text variant="bodyMd" color="subdued">
                  {getExportSummary()}
                </Text>
              </Stack>
            </Card.Section>
          </Card>

          {/* Template Selection */}
          <Card>
            <Card.Section>
              <FormLayout>
                <Select
                  label="Export Template"
                  options={templateOptions}
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  helpText="Choose a pre-configured export template or customize options below"
                />
                
                {templates.find(t => t.id === selectedTemplate) && (
                  <Text variant="bodyMd" color="subdued">
                    {templates.find(t => t.id === selectedTemplate)?.description}
                  </Text>
                )}
              </FormLayout>
            </Card.Section>
          </Card>

          {/* Custom Options */}
          <Card>
            <Card.Section>
              <Stack vertical spacing="loose">
                <Text variant="headingMd" as="h3">Export Options</Text>
                
                <FormLayout>
                  <Select
                    label="Export Type"
                    options={exportTypeOptions}
                    value={customOptions.exportType || 'detailed'}
                    onChange={(value) => handleOptionChange('exportType', value)}
                  />

                  {customOptions.exportType === 'summary' && (
                    <Select
                      label="Group Summary By"
                      options={groupByOptions}
                      value={customOptions.groupBy || 'date'}
                      onChange={(value) => handleOptionChange('groupBy', value)}
                    />
                  )}

                  <Select
                    label="Store State (for GST calculations)"
                    options={stateOptions}
                    value={customOptions.storeState || defaultStoreState}
                    onChange={(value) => handleOptionChange('storeState', value)}
                    helpText="Select your store's state for accurate GST calculations"
                  />

                  <Stack vertical spacing="tight">
                    <Checkbox
                      label="Include GST Breakdown"
                      checked={customOptions.includeGSTBreakdown || false}
                      onChange={(checked) => handleOptionChange('includeGSTBreakdown', checked)}
                      helpText="Include detailed GST calculations (CGST, SGST, IGST) for Indian tax compliance"
                    />

                    {customOptions.exportType === 'detailed' && (
                      <Checkbox
                        label="Group by Date"
                        checked={customOptions.groupByDate || false}
                        onChange={(checked) => handleOptionChange('groupByDate', checked)}
                        helpText="Sort orders by date in the export"
                      />
                    )}
                  </Stack>
                </FormLayout>
              </Stack>
            </Card.Section>
          </Card>

          {/* Export Progress */}
          {isExporting && (
            <Card>
              <Card.Section>
                <Stack vertical spacing="tight">
                  <Text variant="headingMd" as="h3">Exporting...</Text>
                  <ProgressBar progress={exportProgress} />
                  <Text variant="bodyMd" color="subdued">
                    Generating CSV file with order data and GST calculations
                  </Text>
                </Stack>
              </Card.Section>
            </Card>
          )}

          {/* Success Message */}
          {isSuccess && (
            <Banner status="success" title="Export Completed">
              <p>Your CSV file has been generated and downloaded successfully.</p>
            </Banner>
          )}

          {/* Error Message */}
          {isError && error && (
            <Banner status="critical" title="Export Failed">
              <p>{error}</p>
            </Banner>
          )}

          {/* Export Information */}
          <Card>
            <Card.Section>
              <Stack vertical spacing="tight">
                <Text variant="headingMd" as="h3">What's Included in the Export</Text>
                <List type="bullet">
                  <List.Item>Order details (number, date, customer information)</List.Item>
                  <List.Item>Product details (name, variant, quantity, price)</List.Item>
                  <List.Item>Customer addresses (shipping and billing)</List.Item>
                  {customOptions.includeGSTBreakdown && (
                    <>
                      <List.Item>GST breakdown (CGST, SGST, IGST as applicable)</List.Item>
                      <List.Item>HSN codes for textile products</List.Item>
                      <List.Item>Tax calculations based on Indian GST regulations</List.Item>
                    </>
                  )}
                </List>
                
                <Divider />
                
                <Text variant="bodyMd" color="subdued">
                  The exported CSV file will be formatted for Indian business requirements and can be used for:
                </Text>
                <List type="bullet">
                  <List.Item>GST return filing</List.Item>
                  <List.Item>Accounting and bookkeeping</List.Item>
                  <List.Item>Business analysis and reporting</List.Item>
                  <List.Item>Inventory management</List.Item>
                </List>
              </Stack>
            </Card.Section>
          </Card>
        </Stack>
      </Modal.Section>
    </Modal>
  );
}