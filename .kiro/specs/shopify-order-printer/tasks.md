# Implementation Plan

- [x] 1. Initialize Shopify Native App Project
  - Create new Shopify app using Shopify CLI with Next.js template
  - Configure shopify.app.toml with app settings, scopes, and webhooks
  - Set up development environment with ngrok for local testing
  - Install and configure Shopify dependencies (App Bridge, Polaris, GraphQL client)
  - _Requirements: 6.1, 6.2, 6.7_

- [x] 2. Set up Project Structure and Configuration
  - Create Next.js App Router directory structure following Shopify patterns
  - Configure TypeScript with proper types for Shopify integration
  - Set up environment variables for Shopify app configuration
  - Configure Next.js for embedded app with proper headers and CSP
  - _Requirements: 6.1, 6.3, 8.1_

- [x] 3. Implement Shopify Authentication and App Bridge Integration
- [x] 3.1 Set up Shopify OAuth flow
  - Implement OAuth initiation route using Shopify's authentication flow
  - Create OAuth callback handler for token exchange
  - Set up session storage for Shopify tokens and shop data
  - _Requirements: 1.2, 6.4_

- [x] 3.2 Configure App Bridge provider
  - Create root layout with AppBridgeProvider and Polaris AppProvider
  - Implement middleware for Shopify app authentication
  - Set up proper security headers for embedded app experience
  - Test app installation and embedding in Shopify admin
  - _Requirements: 1.1, 1.5, 6.2_

- [x] 4. Create Core Data Models and Types
  - Define TypeScript interfaces for Shopify order data structure
  - Create GST-specific types for Indian tax compliance
  - Implement template and app settings interfaces
  - Set up utility types for GraphQL responses and metafield data
  - _Requirements: 3.5, 5.4, 6.6_

- [x] 5. Build Shopify GraphQL Integration Service
- [x] 5.1 Implement GraphQL client setup
  - Create authenticated GraphQL client using Shopify Admin API
  - Implement error handling for GraphQL queries and mutations
  - Set up rate limiting and retry logic for API calls
  - _Requirements: 1.3, 6.5_

- [x] 5.2 Create order fetching functionality
  - Write GraphQL queries for fetching orders with customer and line item data
  - Implement order filtering by date range and status
  - Create single order detail fetching with full product information
  - Add pagination support for large order lists
  - _Requirements: 1.3, 4.2_

- [x] 6. Implement GST Calculation Service
- [x] 6.1 Create core GST calculation logic
  - Implement tax rate determination based on order total (5% < ₹1000, 12% ≥ ₹1000)
  - Create CGST/SGST vs IGST logic based on customer and store state comparison
  - Add HSN code handling for textile products from product metafields
  - Write unit tests for all GST calculation scenarios
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.3_

- [x] 6.2 Integrate GST calculations with Shopify order data
  - Create service to extract customer and store address information
  - Implement GST breakdown generation for individual orders
  - Add support for multiple line items with different tax rates
  - Create GST summary calculations for bulk operations
  - _Requirements: 3.5, 5.1, 5.2_

- [x] 7. Build Template Management System
- [x] 7.1 Create template data storage using Shopify metafields
  - Implement metafield service for storing template configurations
  - Create default template with Indian business compliance fields
  - Add template CRUD operations using Shopify's app data storage
  - _Requirements: 2.3, 5.4, 6.6_

- [x] 7.2 Implement template editor with Polaris components
  - Create template editor interface using Polaris form components
  - Build real-time preview functionality with sample order data
  - Add business information form with GSTIN and Indian address fields
  - Implement template layout controls (margins, fonts, colors)
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [ ] 8. Create Order Management Interface
- [x] 8.1 Build orders list page with Polaris DataTable
  - Create orders page using Polaris DataTable component
  - Implement order filtering and search functionality
  - Add GST breakdown display for each order
  - Create order detail view with full customer and product information
  - _Requirements: 1.4, 3.5, 5.1_

- [x] 8.2 Implement order actions and navigation
  - Add individual order printing functionality
  - Create navigation between orders, templates, and bulk print pages
  - Implement order status indicators and customer information display
  - Add T-shirt specific product details (size, color, design)
  - _Requirements: 1.5, 5.1, 5.2_

- [x] 9. Build Bulk Printing Interface
- [x] 9.1 Create bulk print page with Polaris components
  - Implement date range picker using Polaris DatePicker
  - Create order selection interface with checkboxes and filters
  - Add progress indicators using Polaris ProgressBar for bulk operations
  - Build action buttons for PDF and CSV export options
  - _Requirements: 4.1, 4.3, 4.7_

- [x] 9.2 Implement bulk operation processing
  - Create job queue system for handling bulk print requests
  - Implement bulk PDF generation with proper GST breakdowns
  - Create bulk CSV export with all order data and tax information
  - Add job status tracking and download link generation
  - _Requirements: 4.4, 4.5, 4.6_

- [ ] 10. Implement PDF Generation Service
- [ ] 10.1 Create PDF generation with Indian compliance
  - Build PDF service using puppeteer or similar library
  - Implement template rendering with GST breakdown display
  - Add HSN codes and Indian business information to PDF output
  - Create proper formatting for T-shirt product details
  - _Requirements: 4.4, 5.3, 5.4_

- [ ] 10.2 Integrate PDF service with Shopify file handling
  - Implement file storage and download through Shopify's file system
  - Create PDF preview functionality for template testing
  - Add bulk PDF generation with multiple orders in single file
  - Implement proper error handling and file cleanup
  - _Requirements: 4.4, 4.6_

- [ ] 11. Create CSV Export Service
  - Implement CSV generation with order data and GST breakdowns
  - Add all required fields including customer info, product details, and tax calculations
  - Create proper CSV formatting for Indian business requirements
  - Integrate with bulk print interface for date range exports
  - _Requirements: 4.5, 4.6_

- [ ] 12. Implement Webhook Handlers
- [ ] 12.1 Set up order webhooks
  - Create webhook endpoints for orders/create and orders/updated
  - Implement proper webhook verification using HMAC
  - Add real-time order data synchronization
  - Create error handling and retry mechanisms for failed webhooks
  - _Requirements: 7.1, 7.2, 7.4, 8.2_

- [ ] 12.2 Handle app lifecycle webhooks
  - Implement app/uninstalled webhook for data cleanup
  - Create proper data retention and deletion according to Shopify policies
  - Add webhook logging and monitoring
  - _Requirements: 7.5, 8.5_

- [ ] 13. Build App Settings Interface
  - Create settings page using Polaris form components
  - Implement GST configuration (store state, tax rates, HSN codes)
  - Add Indian business information setup (GSTIN, address, contact details)
  - Create default template selection and app preferences
  - _Requirements: 5.5, 6.6, 7.3_

- [ ] 14. Set up Production Deployment
- [ ] 14.1 Configure production environment
  - Set up production hosting (Vercel or Railway)
  - Configure production environment variables and secrets
  - Set up SSL certificates and domain configuration
  - Create production database and session storage
  - _Requirements: 6.7, 8.1_

- [ ] 14.2 Prepare for Shopify App Store submission
  - Create app listing with screenshots and descriptions
  - Implement proper error handling and user feedback
  - Add comprehensive logging and monitoring
  - Prepare app for Shopify Partner review process
  - _Requirements: 8.4, 6.7_

- [ ] 15. Final Testing and Quality Assurance
  - Perform comprehensive testing of all features in production environment
  - Test app installation and uninstallation processes
  - Validate GST calculations with real Indian business scenarios
  - Conduct security testing and vulnerability assessment
  - _Requirements: 8.4, 3.1, 3.2, 3.3, 8.1_