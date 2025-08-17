# App Settings Interface

This module provides a comprehensive settings interface for the Shopify Order Printer app, allowing users to configure GST settings, business information, and app preferences.

## Components

### AppSettings
The main settings component that provides a tabbed interface for managing all app settings.

**Features:**
- GST Configuration (tax rates, HSN codes, store state)
- Business Information (company details, address, contact info, bank details)
- App Preferences (templates, export formats, webhooks)
- Form validation with error handling
- Real-time updates with toast notifications

### useSettings Hook
A custom React hook for managing settings state and API interactions.

**Methods:**
- `settings`: Current settings data
- `loading`: Loading state
- `error`: Error message if any
- `updateSettings(updates)`: Update settings
- `refreshSettings()`: Refresh settings from server

## API Endpoints

### GET /api/settings
Retrieves current app settings for the authenticated shop.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "settings_shop-domain",
    "shopDomain": "shop-domain.myshopify.com",
    "gstConfiguration": { ... },
    "businessInfo": { ... },
    "preferences": { ... },
    "webhooks": { ... }
  }
}
```

### PUT /api/settings
Updates app settings for the authenticated shop.

**Request Body:**
```json
{
  "gstConfiguration": { ... },
  "businessInfo": { ... },
  "preferences": { ... },
  "webhooks": { ... }
}
```

## Validation

The settings interface includes validation for:
- GSTIN format (15-character Indian GST number)
- Pincode format (6-digit Indian postal code)
- Required fields for business information
- Tax rate ranges and thresholds

## Usage

```tsx
import { AppSettings } from '@/components/settings/AppSettings'

export default function SettingsPage() {
  return (
    <div>
      <h1>App Settings</h1>
      <AppSettings />
    </div>
  )
}
```

## Configuration Options

### GST Configuration
- Store state selection
- Tax rates (low/high) with percentage inputs
- Threshold amount for rate determination
- HSN codes for different product types

### Business Information
- Company name and GSTIN
- Complete business address
- Contact information (phone, email, website)
- Optional bank details for invoices

### Preferences
- Default template selection
- GST display preferences
- Export format defaults
- Date format options
- Webhook configurations

## Testing

The settings interface includes comprehensive tests:
- API endpoint tests for GET/PUT operations
- Validation tests for GSTIN and pincode formats
- Authentication tests
- Hook functionality tests

Run tests with:
```bash
npm run test -- app/api/settings/__tests__/route.test.ts --run
npm run test -- hooks/__tests__/useSettings.test.ts --run
```