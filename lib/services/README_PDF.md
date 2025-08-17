# PDF Generation Service Implementation

This document describes the PDF generation service implementation for the Shopify Order Printer app with Indian GST compliance.

## Overview

The PDF generation service provides comprehensive functionality for creating, storing, and managing PDF documents for Shopify orders with Indian tax compliance features.

## Components

### 1. PDFService (`lib/services/pdfService.ts`)

Main service class that handles PDF generation with Indian GST compliance.

**Key Features:**
- Generate PDF for single orders with GST breakdown
- Generate bulk PDFs for multiple orders
- Template-based PDF generation with customizable layouts
- Indian business information integration (GSTIN, HSN codes)
- T-shirt specific product details formatting
- File storage integration for download links

**Main Methods:**
- `generateOrderPDF()` - Generate PDF for single order
- `generateBulkPDF()` - Generate PDF for multiple orders
- `generateAndStoreOrderPDF()` - Generate and store single order PDF
- `generateAndStoreBulkPDF()` - Generate and store bulk PDF
- `generatePreviewPDF()` - Generate template preview
- `validatePDFRequirements()` - Validate system requirements

### 2. FileStorageService (`lib/services/fileStorageService.ts`)

Handles file storage and retrieval using Shopify's metafield system.

**Key Features:**
- Store generated PDFs with expiration dates
- Retrieve stored files with download URLs
- Automatic cleanup of expired files
- File metadata management
- Secure file access through API routes

**Main Methods:**
- `storeFile()` - Store generated file
- `getFile()` - Retrieve file metadata
- `getFileBuffer()` - Get file content for download
- `deleteFile()` - Delete stored file
- `listFiles()` - List all stored files
- `cleanupExpiredFiles()` - Remove expired files

### 3. API Routes

#### Print API (`app/api/print/route.ts`)
- `POST /api/print` - Generate PDF for orders
- `GET /api/print` - Generate single order PDF or preview

**Request Parameters:**
- `orderIds` - Array of order IDs to process
- `options` - PDF generation options (template, GST settings)
- `storeFile` - Whether to store file for download
- `storageOptions` - File storage configuration

#### Download API (`app/api/print/download/[fileKey]/route.ts`)
- `GET /api/print/download/[fileKey]` - Download stored PDF
- `DELETE /api/print/download/[fileKey]` - Delete stored PDF

### 4. Utility Functions (`lib/services/orderUtils.ts`)

Enhanced with PDF-specific utilities:
- `formatCurrency()` - Format amounts with Indian Rupee symbol
- `formatDate()` - Format dates in various formats
- `generatePDFFilename()` - Generate unique PDF filenames
- `validateOrderForPDF()` - Validate order data for PDF generation

## Indian GST Compliance Features

### GST Breakdown Display
- Automatic GST rate calculation (5% < ₹1000, 12% ≥ ₹1000)
- CGST/SGST vs IGST based on customer and store states
- Detailed tax breakdown in PDF output

### HSN Code Integration
- HSN codes for textile products (T-shirts)
- Product-specific HSN code extraction from metafields
- Default HSN code (6109) for T-shirt products

### Business Information
- GSTIN display and validation
- Indian address formatting
- Bank details for payment information
- Company logo and branding integration

### T-shirt Specific Details
- Size, color, design, and material extraction
- Variant-based product information
- Custom product properties handling

## PDF Template Features

### Layout Options
- A4, A5, Letter page sizes
- Portrait/landscape orientation
- Customizable margins and fonts
- Color scheme configuration

### Content Sections
- Company header with logo and GSTIN
- Invoice information (number, date, status)
- Customer details with shipping/billing addresses
- Itemized product list with T-shirt details
- GST breakdown with tax calculations
- Footer with bank details and generation timestamp

### Template Customization
- Visual template editor integration
- Real-time preview functionality
- Multiple template support
- Default template with Indian compliance

## File Management

### Storage Strategy
- Files stored as base64 in Shopify metafields
- Automatic expiration (24h for single orders, 48h for bulk)
- Unique file keys for secure access
- Metadata tracking (size, type, creation date)

### Download System
- Secure download URLs through API routes
- File access validation and expiration checks
- Automatic cleanup of expired files
- Error handling for missing/expired files

## Error Handling

### PDF Generation Errors
- Template validation and fallbacks
- Order data validation
- Browser initialization failures
- Memory and resource management

### File Storage Errors
- Shopify API rate limiting
- File size limitations
- Storage quota management
- Network connectivity issues

### GST Calculation Errors
- Missing customer state information
- Invalid order amounts
- Tax rate configuration issues
- Product classification problems

## Performance Considerations

### Browser Management
- Puppeteer browser instance pooling
- Automatic browser cleanup
- Memory optimization for bulk operations
- Concurrent PDF generation limits

### File Storage Optimization
- Base64 encoding for Shopify compatibility
- File size monitoring and limits
- Batch operations for bulk processing
- Efficient metadata queries

## Security Features

### Access Control
- Session-based authentication
- File key validation
- Secure download URLs
- User permission checks

### Data Protection
- Customer data encryption in transit
- Secure file storage in Shopify
- Automatic data cleanup
- GDPR compliance considerations

## Usage Examples

### Generate Single Order PDF
```typescript
const pdfService = new PDFService(session);
const result = await pdfService.generateOrderPDF(order, {
  templateId: 'custom-template',
  includeGSTBreakdown: true,
  includeHSNCodes: true
});
```

### Generate and Store Bulk PDF
```typescript
const result = await pdfService.generateAndStoreBulkPDF(orders, {
  groupByDate: true,
  includeOrderSummary: true,
  maxOrdersPerPage: 5
}, {
  expiresInHours: 48
});
```

### File Storage Operations
```typescript
const fileService = new FileStorageService(session);
const storeResult = await fileService.storeFile(generatedFile);
const downloadResult = await fileService.getFileBuffer(fileKey);
```

## Testing

The implementation includes comprehensive test coverage:
- Unit tests for PDF generation logic
- Integration tests for file storage
- Mock data for GST calculations
- Error handling validation
- Performance benchmarking

## Dependencies

- `puppeteer` - PDF generation engine
- `@shopify/shopify-api` - Shopify integration
- `@shopify/polaris` - UI components (for frontend)
- Custom GST calculation utilities
- Template management services

## Future Enhancements

- PDF compression for large files
- Watermarking and digital signatures
- Multi-language support
- Advanced template designer
- Batch processing optimization
- Cloud storage integration
- Analytics and reporting