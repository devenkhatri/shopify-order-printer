# Local Development Setup Guide

This guide will help you set up the Shopify Order Printer app for local development with all necessary environment variables and configurations.

## Prerequisites

Before starting, ensure you have:

- [Node.js 18+](https://nodejs.org/en/download/) installed
- [Shopify Partner Account](https://partners.shopify.com/signup)
- [Development Store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store) or [Shopify Plus Sandbox](https://help.shopify.com/en/partners/dashboard/managing-stores/plus-sandbox-store)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli/installation) installed
- [Git](https://git-scm.com/downloads) installed

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd shopify-order-printer

# Install dependencies
npm install

# Or using yarn
yarn install
```

## Step 2: Create Shopify App in Partner Dashboard

1. Go to your [Shopify Partner Dashboard](https://partners.shopify.com/)
2. Click "Apps" → "Create app"
3. Choose "Create app manually"
4. Fill in app details:
   - **App name**: "Order Printer - Indian GST" (or your preferred name)
   - **App URL**: `https://your-ngrok-url.ngrok.io` (will be updated later)
   - **Allowed redirection URL(s)**: `https://your-ngrok-url.ngrok.io/api/auth`

5. Save the app and note down:
   - **API key** (Client ID)
   - **API secret key** (Client secret)

## Step 3: Configure Environment Variables

### Create Local Environment File

Copy the example environment file and configure it:

```bash
cp .env.example .env.local
```

### Required Environment Variables

Edit `.env.local` with your specific values:

```bash
# ==============================================
# SHOPIFY APP CONFIGURATION (REQUIRED)
# ==============================================

# Get these from your Shopify Partner Dashboard → Apps → Your App
SHOPIFY_API_KEY=your_api_key_from_partner_dashboard
SHOPIFY_API_SECRET=your_api_secret_from_partner_dashboard

# This will be automatically set by Shopify CLI during development
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io

# Generate a random webhook secret (32+ characters recommended)
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_here_minimum_32_chars

# ==============================================
# NEXT.JS PUBLIC VARIABLES (REQUIRED)
# ==============================================

# Same as SHOPIFY_API_KEY (needed for frontend)
NEXT_PUBLIC_SHOPIFY_API_KEY=your_api_key_from_partner_dashboard

# ==============================================
# DEVELOPMENT CONFIGURATION
# ==============================================

NODE_ENV=development
PORT=3000
BACKEND_PORT=3000

# ==============================================
# DATABASE CONFIGURATION
# ==============================================

# For local development (SQLite)
DATABASE_URL=sqlite:database.sqlite

# For PostgreSQL (if you prefer)
# DATABASE_URL=postgresql://username:password@localhost:5432/shopify_order_printer

# For MySQL (if you prefer)
# DATABASE_URL=mysql://username:password@localhost:3306/shopify_order_printer

# ==============================================
# SESSION STORAGE (REQUIRED)
# ==============================================

# Generate a strong session secret (32+ characters)
SESSION_SECRET=your_very_strong_session_secret_minimum_32_characters_long

# ==============================================
# INDIAN GST CONFIGURATION
# ==============================================

# Default store state for GST calculations
DEFAULT_STORE_STATE=Gujarat

# GST rates for different order values
DEFAULT_GST_RATES_BELOW_1000=0.05
DEFAULT_GST_RATES_ABOVE_1000=0.12

# ==============================================
# FILE STORAGE CONFIGURATION
# ==============================================

# Directory for storing generated PDFs and CSVs
UPLOAD_DIR=./uploads

# Maximum file size (10MB in bytes)
MAX_FILE_SIZE=10485760

# ==============================================
# LOGGING CONFIGURATION
# ==============================================

# Log level for development
LOG_LEVEL=debug

# Enable request logging in development
ENABLE_REQUEST_LOGGING=true

# ==============================================
# OPTIONAL: ANALYTICS & MONITORING
# ==============================================

# Enable analytics in development (optional)
ANALYTICS_ENABLED=false

# Google Analytics (optional)
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Mixpanel (optional)
# NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token

# Custom analytics endpoint (optional)
# CUSTOM_ANALYTICS_ENDPOINT=https://your-analytics-endpoint.com
# ANALYTICS_API_KEY=your_analytics_api_key

# ==============================================
# OPTIONAL: EXTERNAL SERVICES
# ==============================================

# Sentry for error tracking (optional)
# SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Webhook monitoring (optional)
# WEBHOOK_MONITORING_URL=https://your-monitoring-webhook.com

# Business metrics endpoint (optional)
# BUSINESS_METRICS_ENDPOINT=https://your-metrics-endpoint.com

# ==============================================
# DEVELOPMENT TOOLS
# ==============================================

# Enable Next.js telemetry (set to 0 to disable)
NEXT_TELEMETRY_DISABLED=1

# Enable React strict mode
REACT_STRICT_MODE=true
```

### Environment Variable Descriptions

| Variable | Required | Description |
|----------|----------|-------------|
| `SHOPIFY_API_KEY` | ✅ | Your app's API key from Partner Dashboard |
| `SHOPIFY_API_SECRET` | ✅ | Your app's API secret from Partner Dashboard |
| `SHOPIFY_APP_URL` | ✅ | Your app's URL (set automatically by CLI) |
| `SHOPIFY_WEBHOOK_SECRET` | ✅ | Secret for webhook verification |
| `NEXT_PUBLIC_SHOPIFY_API_KEY` | ✅ | Same as API key, for frontend use |
| `SESSION_SECRET` | ✅ | Strong secret for session encryption |
| `DATABASE_URL` | ✅ | Database connection string |
| `DEFAULT_STORE_STATE` | ✅ | Indian state for GST calculations |
| `DEFAULT_GST_RATES_*` | ✅ | GST rates for different order values |
| `LOG_LEVEL` | ❌ | Logging level (debug, info, warn, error) |
| `UPLOAD_DIR` | ❌ | Directory for file storage |
| `ANALYTICS_ENABLED` | ❌ | Enable/disable analytics tracking |

## Step 4: Generate Secure Secrets

### Generate Session Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Generate Webhook Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 5: Update Shopify App Configuration

Update your `shopify.app.toml` file:

```toml
# Learn more about configuring your app at https://shopify.dev/docs/apps/tools/cli/configuration

client_id = "your_api_key_here"
name = "order-printer-pdf-csv"
handle = "order-printer-pdf-csv"
application_url = "https://your-ngrok-url.ngrok.io/"
embedded = true

[build]
include_config_on_deploy = true

[webhooks]
api_version = "2025-07"

[[webhooks.subscriptions]]
topics = [ "orders/create", "orders/updated", "orders/paid" ]
uri = "/api/webhooks/orders"

[[webhooks.subscriptions]]
topics = [ "app/uninstalled" ]
uri = "/api/webhooks/app/uninstalled"

[access_scopes]
# Scopes required for Indian T-shirt store order management and GST compliance
scopes = "read_orders,read_customers,read_products,read_product_listings,read_inventory,read_locations,read_shipping,read_analytics,read_reports,write_files,read_content,write_content"

[auth]
redirect_urls = [ "https://your-ngrok-url.ngrok.io/api/auth" ]

[pos]
embedded = false
```

## Step 6: Set Up Database

### For SQLite (Default - Recommended for Development)

No additional setup required. The database file will be created automatically.

### For PostgreSQL (Optional)

```bash
# Install PostgreSQL locally
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE shopify_order_printer;
CREATE USER shopify_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE shopify_order_printer TO shopify_user;
\q

# Update DATABASE_URL in .env.local
DATABASE_URL=postgresql://shopify_user:your_password@localhost:5432/shopify_order_printer
```

### For MySQL (Optional)

```bash
# Install MySQL locally
# macOS
brew install mysql
brew services start mysql

# Ubuntu/Debian
sudo apt-get install mysql-server
sudo systemctl start mysql

# Create database and user
mysql -u root -p
CREATE DATABASE shopify_order_printer;
CREATE USER 'shopify_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON shopify_order_printer.* TO 'shopify_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Update DATABASE_URL in .env.local
DATABASE_URL=mysql://shopify_user:your_password@localhost:3306/shopify_order_printer
```

## Step 7: Initialize Database Schema

Run the database setup script:

```bash
# For SQLite (default)
npm run setup:db

# For PostgreSQL
psql $DATABASE_URL -f scripts/setup-production-db.sql

# For MySQL
mysql -h localhost -u shopify_user -p shopify_order_printer < scripts/setup-production-db.sql
```

## Step 8: Start Development Server

```bash
# Start the development server with Shopify CLI
npm run dev

# Or using yarn
yarn dev

# Or using pnpm
pnpm dev
```

The Shopify CLI will:
1. Start your local development server
2. Create an ngrok tunnel
3. Update your app's URLs automatically
4. Open your app in a development store

## Step 9: Install App in Development Store

1. The CLI will provide a URL to install your app
2. Click the URL and follow the installation process
3. Grant the required permissions
4. You should see the app dashboard with GST calculations

## Step 10: Verify Setup

### Check Health Endpoints

```bash
# System health check
curl http://localhost:3000/api/webhooks/health?type=system

# Webhook health check
curl http://localhost:3000/api/webhooks/health
```

### Test GST Calculations

1. Go to your development store
2. Create a test order with Indian customer address
3. Open the Order Printer app
4. Verify GST calculations are working correctly

## Troubleshooting

### Common Issues

#### 1. "SHOPIFY_API_KEY is not defined"

**Solution**: Ensure `SHOPIFY_API_KEY` and `NEXT_PUBLIC_SHOPIFY_API_KEY` are set in `.env.local`

#### 2. "Session secret is not defined"

**Solution**: Generate and set a strong `SESSION_SECRET` in `.env.local`

#### 3. "Database connection failed"

**Solution**: 
- For SQLite: Ensure the app has write permissions in the project directory
- For PostgreSQL/MySQL: Verify database is running and credentials are correct

#### 4. "Webhook verification failed"

**Solution**: Ensure `SHOPIFY_WEBHOOK_SECRET` matches the secret in your Partner Dashboard

#### 5. "App not loading in Shopify admin"

**Solution**: 
- Check that ngrok tunnel is active
- Verify `SHOPIFY_APP_URL` matches the tunnel URL
- Ensure app URLs are updated in Partner Dashboard

### Debug Mode

Enable debug logging:

```bash
# Add to .env.local
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

### Reset Development Environment

```bash
# Clear database
rm database.sqlite

# Clear uploads
rm -rf uploads/*

# Restart development server
npm run dev
```

## Next Steps

Once your local development environment is working:

1. **Test Core Features**: Verify GST calculations, PDF generation, and CSV export
2. **Test Webhooks**: Create/update orders and verify webhook processing
3. **Customize Templates**: Use the template editor to create custom receipts
4. **Add Test Data**: Create sample orders with different scenarios
5. **Review Logs**: Check application logs for any errors or warnings

## Development Workflow

### Daily Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Before Committing

```bash
# Run all checks
npm run test:run
npm run type-check
npm run lint

# Build to verify production compatibility
npm run build
```

## Additional Resources

- [Shopify App Development Documentation](https://shopify.dev/docs/apps)
- [Shopify CLI Documentation](https://shopify.dev/docs/apps/tools/cli)
- [Next.js Documentation](https://nextjs.org/docs)
- [Shopify Polaris Design System](https://polaris.shopify.com/)
- [Indian GST Guidelines](https://www.gst.gov.in/)

## Support

If you encounter issues:

1. Check this documentation first
2. Review the troubleshooting section
3. Check application logs
4. Consult Shopify developer documentation
5. Create an issue in the project repository