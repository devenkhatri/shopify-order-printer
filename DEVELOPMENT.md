# Development Setup Guide

## Prerequisites

1. Node.js (>= 16.13.0)
2. npm or yarn
3. Shopify CLI
4. ngrok (for local development)
5. Shopify Partner account

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Shopify app credentials
   ```

3. **Start ngrok (in a separate terminal):**
   ```bash
   ngrok http 3000
   ```

4. **Update your app URL:**
   - Copy the ngrok HTTPS URL
   - Update the `HOST` variable in your `.env` file
   - Update `application_url` in `shopify.app.toml`

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## App Configuration

The app is configured with the following scopes in `shopify.app.toml`:
- `read_orders` - Access order data
- `read_customers` - Access customer information
- `read_products` - Access product details
- `read_inventory` - Access inventory data
- `write_files` - Generate and store PDF/CSV files
- And other necessary scopes for Indian GST compliance

## Webhooks

The app listens for the following webhooks:
- `orders/create` - New order notifications
- `orders/updated` - Order update notifications
- `orders/paid` - Payment confirmation
- `app/uninstalled` - App uninstallation cleanup

## Architecture

- **Backend**: Node.js/Express with Shopify App Express library
- **Frontend**: React with Shopify Polaris and App Bridge
- **Database**: SQLite for session storage
- **PDF Generation**: Puppeteer
- **CSV Export**: csv-writer library
- **GraphQL**: Apollo Client for Shopify Admin API

## Key Features

1. **GST Calculation**: Automatic Indian GST calculation based on order amount and customer location
2. **Template Management**: Customizable order print templates
3. **Bulk Operations**: Date range selection for bulk PDF/CSV export
4. **Order Management**: View and manage orders with GST breakdown
5. **Indian Compliance**: HSN codes, GSTIN, and other Indian business requirements