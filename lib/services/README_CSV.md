# CSV Export Service

The CSV Export Service provides comprehensive functionality for exporting Shopify order data to CSV format with Indian GST compliance features.

## Features

- **Detailed Order Export**: Export complete order information with line-item details
- **GST Compliance**: Automatic GST calculations (CGST, SGST, IGST) based on Indian tax regulations
- **Multiple Export Formats**: Detailed exports, summary reports, and custom groupings
- **Date Range Filtering**: Export orders within specific date ranges
- **Indian Business Requirements**: HSN codes, GSTIN support, and proper tax formatting
- **Bulk Operations**: Handle large datasets efficiently with validation and error handling

## Usage

### Basic CSV Export

```typescript
import { csvExportService } from '@/lib/services/csvExportService';

// Export orders with GST breakdown
const result = await csvExportService.generateCSVFile(orders, {
  includeGSTBreakdown: true,
  groupByDate: false,
  filename: 'orders_export.csv'
});

console.log(result.content); // CSV content
console.log(result.filename); // Generated filename
```

### Date Range Export

```typescript
const result = await csvExportService.generateDateRangeCSV(
  orders,
  { from: '2024-01-01', to: '2024-01-31' },
  {
    includeGSTBreakdown: true,
    groupByDate: true
  }
);
```

### Summary Reports

```typescript
// Generate summary grouped by date
const summaryResult = await csvExportService.generateSummaryCSV(orders, {
  groupBy: 'date',
  includeGSTBreakdown: true
});

// Generate summary grouped by customer
const customerSummary = await csvExportService.generateSummaryCSV(orders, {
  groupBy: 'customer',
  includeGSTBreakdown: true
});
```

### Store State Configuration

```typescript
// Set store state for accurate GST calculations
csvExportService.setStoreState('MH'); // Maharashtra
csvExportService.setStoreState('KA'); // Karnataka
```

## API Endpoints

### POST /api/export/csv

Export orders with advanced options:

```json
{
  "orderIds": ["12345", "12346"],
  "dateRange": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "includeGSTBreakdown": true,
  "groupByDate": false,
  "exportType": "detailed",
  "groupBy": "date",
  "storeState": "MH"
}
```

### GET /api/export/csv

Quick export with query parameters:

```
GET /api/export/csv?orderIds=12345,12346&includeGST=true&groupByDate=true&storeState=MH
```

## CSV Output Format

### Detailed Export Headers

- Order Number
- Order Date
- Customer Name
- Customer Email
- Customer Phone
- Shipping Address
- Billing Address
- Product Name
- Variant
- Quantity
- Unit Price (₹)
- Line Total (₹)
- HSN Code
- GST Type (CGST_SGST or IGST)
- GST Rate (%)
- CGST Amount (₹)
- SGST Amount (₹)
- IGST Amount (₹)
- Total GST (₹)
- Total Amount (₹)

### Summary Export Headers

- Date/Customer/Product (depending on grouping)
- Order Count
- Total Quantity
- Total Subtotal (₹)
- Total GST (₹)
- Total Amount (₹)
- Average Order Value (₹)

## GST Calculations

The service automatically calculates GST based on Indian tax regulations:

### Tax Rates
- Orders < ₹1000: 5% GST
- Orders ≥ ₹1000: 12% GST

### Tax Types
- **Same State**: CGST + SGST (split equally)
- **Different States**: IGST (full amount)

### HSN Codes
- Textile products: Automatically detected from product metadata
- Cotton: 52091000
- Polyester: 54071000
- Blends: 60011000

## React Integration

### Using the Hook

```typescript
import { useCSVExport } from '@/hooks/useCSVExport';

function ExportComponent() {
  const { exportOrdersByIds, isExporting, exportProgress } = useCSVExport();

  const handleExport = () => {
    exportOrdersByIds(['12345', '12346'], {
      includeGSTBreakdown: true,
      storeState: 'MH'
    });
  };

  return (
    <div>
      <button onClick={handleExport} disabled={isExporting}>
        {isExporting ? `Exporting... ${exportProgress}%` : 'Export CSV'}
      </button>
    </div>
  );
}
```

### Using the Dialog Component

```typescript
import { CSVExportDialog } from '@/components/export/CSVExportDialog';

function BulkPrintPage() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState(['12345', '12346']);

  return (
    <div>
      <button onClick={() => setShowExportDialog(true)}>
        Export Selected Orders
      </button>
      
      <CSVExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        orderIds={selectedOrders}
        defaultStoreState="MH"
      />
    </div>
  );
}
```

## Validation and Error Handling

### Order Validation

```typescript
const validation = csvExportService.validateOrdersForExport(orders);

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Validation warnings:', validation.warnings);
}
```

### Common Validations

- Maximum 1000 orders per export (POST) / 100 orders (GET)
- Date range cannot exceed 365 days
- Orders must have valid data structure
- Warnings for missing customer information or addresses

## Performance Considerations

- **Large Exports**: Orders are processed in batches to prevent memory issues
- **File Storage**: Generated files are temporarily stored and cleaned up automatically
- **Rate Limiting**: API endpoints respect Shopify's rate limits
- **Memory Management**: CSV content is streamed for large datasets

## Testing

Run the test suite:

```bash
npm run test -- lib/services/__tests__/csvExportService.test.ts
npm run test -- app/api/export/csv/__tests__/route.test.ts
```

## Configuration

### Environment Variables

No specific environment variables required. The service uses:
- Store state from app settings or user input
- GST rates from Indian tax regulations (hardcoded)
- HSN codes from product metadata

### Customization

To customize GST rates or add new HSN codes:

1. Update the GST service configuration
2. Modify the HSN code mapping in product utilities
3. Adjust CSV headers in the export service

## Troubleshooting

### Common Issues

1. **Missing GST Breakdown**: Ensure store state is set correctly
2. **Invalid Date Format**: Use ISO date strings (YYYY-MM-DD)
3. **Large File Timeouts**: Break large exports into smaller batches
4. **Missing HSN Codes**: Add HSN codes to product metadata

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
process.env.DEBUG_CSV_EXPORT = 'true';
```

This will log detailed information about:
- Order processing steps
- GST calculations
- File generation progress
- Validation results