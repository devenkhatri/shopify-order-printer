# Next.js App Router Setup for Shopify Order Printer

This document outlines the Next.js App Router structure and configuration for the Shopify Order Printer app.

## Project Structure

```
├── app/                          # Next.js App Router directory
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles with Tailwind
│   ├── orders/                  # Orders management pages
│   │   ├── page.tsx            # Orders list page
│   │   └── [id]/page.tsx       # Individual order detail page
│   ├── templates/               # Template editor pages
│   │   └── page.tsx            # Template editor page
│   ├── bulk-print/             # Bulk printing pages
│   │   └── page.tsx            # Bulk print interface page
│   ├── settings/               # App settings pages
│   │   └── page.tsx            # Settings page
│   └── api/                    # API routes
│       ├── auth/               # Shopify OAuth routes
│       ├── orders/             # Order management API
│       └── webhooks/           # Webhook handlers
├── components/                  # React components
│   ├── providers/              # Context providers
│   ├── orders/                 # Order-related components
│   ├── templates/              # Template editor components
│   ├── bulk-print/             # Bulk print components
│   └── settings/               # Settings components
├── lib/                        # Utility libraries
│   ├── shopify.ts              # Shopify API configuration
│   ├── services/               # Business logic services
│   └── utils/                  # Utility functions
├── types/                      # TypeScript type definitions
│   └── shopify.ts              # Shopify-specific types
├── middleware.ts               # Next.js middleware for auth
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── tailwind.config.js          # Tailwind CSS configuration
```

## Key Features

### 1. App Router Structure
- Uses Next.js 14 App Router for file-based routing
- Server and client components properly separated
- API routes for Shopify integration

### 2. Shopify Integration
- App Bridge provider for embedded app experience
- Polaris design system for consistent UI
- OAuth authentication flow
- Webhook handlers for real-time updates

### 3. TypeScript Configuration
- Strict TypeScript setup with proper types
- Shopify-specific type definitions
- Path aliases for clean imports

### 4. Security Configuration
- Content Security Policy for embedded apps
- Proper headers for Shopify embedding
- HMAC verification for webhooks

### 5. Development Setup
- Tailwind CSS for styling
- ESLint for code quality
- Environment variable configuration

## Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
# Shopify App Configuration
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io
NEXT_PUBLIC_SHOPIFY_API_KEY=your_shopify_api_key_here

# Additional configuration...
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Shopify app credentials
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Start ngrok for Shopify app development:
   ```bash
   ngrok http 3000
   ```

5. Update your Shopify app URLs with the ngrok URL

## Next Steps

This setup provides the foundation for implementing the remaining tasks:
- Shopify authentication and App Bridge integration
- Order management with GST calculations
- Template editor functionality
- Bulk printing capabilities
- PDF and CSV generation services

Each feature will be implemented as separate tasks following the implementation plan.