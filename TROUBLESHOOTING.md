# Troubleshooting Guide

This guide helps resolve common issues when developing the Shopify Order Printer app.

## Common Runtime Errors

### 1. TypeError: createContext is not a function

**Error Message:**
```
TypeError: (0 , react__WEBPACK_IMPORTED_MODULE_0__.createContext) is not a function
at eval (webpack-internal:///(rsc)/./node_modules/@shopify/polaris/build/esm/utilities/link/context.js:9:86)
```

**Cause:** This error occurs when Shopify Polaris components are being rendered on the server side in Next.js App Router, but they need to be client-side only.

**Solutions:**

#### Solution 1: Clear Next.js Cache (Try this first)
```bash
# Stop the development server
# Then clear the cache
rm -rf .next
npm run dev
```

#### Solution 2: Check Component Structure
Ensure all components using Polaris are marked with `'use client'`:

```tsx
'use client'

import { Page, Card } from '@shopify/polaris'

export function MyComponent() {
  return (
    <Page title="My Page">
      <Card>Content</Card>
    </Page>
  )
}
```

#### Solution 3: Use Dynamic Imports
For pages that use Polaris components:

```tsx
import dynamic from 'next/dynamic'

const ClientComponent = dynamic(
  () => import('@/components/ClientComponent'),
  { ssr: false }
)

export default function Page() {
  return <ClientComponent />
}
```

#### Solution 4: Check Next.js Configuration
Ensure your `next.config.js` includes:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@shopify/polaris',
    '@shopify/app-bridge',
    '@shopify/app-bridge-react'
  ],
  experimental: {
    esmExternals: 'loose',
  },
}
```

#### Solution 5: Verify Package Versions
Check that you have compatible versions:

```json
{
  "dependencies": {
    "@shopify/polaris": "^12.0.0",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

### 2. Authentication Issues

**Error Message:**
```
SHOPIFY_API_KEY is not defined
```

**Solution:**
1. Ensure `.env.local` exists and contains:
```bash
SHOPIFY_API_KEY=your_api_key_here
NEXT_PUBLIC_SHOPIFY_API_KEY=your_api_key_here
```

2. Restart the development server after adding environment variables.

### 3. Database Connection Issues

**Error Message:**
```
Database connection failed
```

**Solutions:**

#### For SQLite (Default):
```bash
# Ensure the project directory is writable
chmod 755 .
# Remove existing database if corrupted
rm -f database.sqlite
```

#### For PostgreSQL:
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
# Check if database exists
psql $DATABASE_URL -c "\l"
```

#### For MySQL:
```bash
# Test connection
mysql -h localhost -u username -p -e "SELECT 1;"
```

### 4. Webhook Verification Failed

**Error Message:**
```
Webhook verification failed
```

**Solution:**
1. Ensure `SHOPIFY_WEBHOOK_SECRET` matches your Partner Dashboard settings
2. Generate a new webhook secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. App Not Loading in Shopify Admin

**Possible Causes:**
- ngrok tunnel is down
- App URLs don't match
- CORS issues

**Solutions:**

1. **Check ngrok tunnel:**
```bash
# Ensure ngrok is running
curl -I https://your-tunnel-url.ngrok.io
```

2. **Update app URLs in Partner Dashboard:**
- App URL: `https://your-tunnel-url.ngrok.io`
- Redirect URLs: `https://your-tunnel-url.ngrok.io/api/auth`

3. **Check environment variables:**
```bash
echo $SHOPIFY_APP_URL
echo $SHOPIFY_API_KEY
```

### 6. Build Errors

**Error Message:**
```
Module not found: Can't resolve '@/components/...'
```

**Solution:**
Check your `tsconfig.json` has proper path mapping:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 7. CSS/Styling Issues

**Error Message:**
```
Module parse failed: Unexpected character '@' (1:0)
You may need an appropriate loader to handle this file type
> @tailwind base;
```

**Cause:** PostCSS configuration issues with Tailwind CSS processing.

**Solutions:**

1. **Check PostCSS configuration:**
```javascript
// postcss.config.js
module.exports = {
  plugins: [
    'tailwindcss',
    'autoprefixer',
  ],
}
```

2. **Remove conflicting package.json type field:**
```json
{
  // Remove this line if present
  // "type": "module",
}
```

3. **Clear Next.js cache:**
```bash
rm -rf .next
npm run dev
```

4. **Verify Tailwind config uses CommonJS:**
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ... rest of config
}

module.exports = config
```

### 8. Polaris Component Import Issues

**Error Message:**
```
Attempted import error: 'Stack' is not exported from '@shopify/polaris'
```

**Cause:** Polaris v12+ replaced `Stack` with `BlockStack` and `InlineStack`.

**Solution:**
Update component imports:
```tsx
// Old (Polaris v11 and below)
import { Stack } from '@shopify/polaris'
<Stack vertical spacing="loose">

// New (Polaris v12+)
import { BlockStack, InlineStack } from '@shopify/polaris'
<BlockStack gap="400">  // for vertical stacking
<InlineStack gap="200"> // for horizontal stacking
```

## Development Workflow Issues

### Hot Reload Not Working

**Solutions:**
1. Check if files are being watched:
```bash
# Increase file watcher limit on Linux/macOS
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

2. Restart development server:
```bash
npm run dev
```

### Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port
PORT=3001 npm run dev
```

## Performance Issues

### Slow Build Times

**Solutions:**
1. Clear Next.js cache:
```bash
rm -rf .next
```

2. Update dependencies:
```bash
npm update
```

3. Check for large files in the project:
```bash
find . -size +10M -type f
```

### Memory Issues

**Solutions:**
1. Increase Node.js memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

2. Check for memory leaks in components

## Testing Issues

### Tests Not Running

**Solutions:**
1. Check test configuration in `package.json`
2. Ensure test files are in correct locations
3. Run tests with verbose output:
```bash
npm run test -- --verbose
```

## Deployment Issues

### Build Fails in Production

**Solutions:**
1. Test build locally:
```bash
npm run build
```

2. Check environment variables are set in production

3. Review build logs for specific errors

### App Not Accessible After Deployment

**Solutions:**
1. Check health endpoint:
```bash
curl https://your-domain.com/api/webhooks/health
```

2. Review server logs

3. Verify SSL certificate:
```bash
openssl s_client -connect your-domain.com:443
```

## Getting Help

If you're still experiencing issues:

1. **Check the logs:**
   - Browser console for client-side errors
   - Terminal output for server-side errors
   - Network tab for API request failures

2. **Enable debug mode:**
   ```bash
   LOG_LEVEL=debug npm run dev
   ```

3. **Create a minimal reproduction:**
   - Isolate the problematic component
   - Test with minimal props/data

4. **Search for similar issues:**
   - Check Shopify developer documentation
   - Search GitHub issues for Polaris and App Bridge

5. **Ask for help:**
   - Include error messages
   - Provide relevant code snippets
   - Mention your environment (OS, Node version, etc.)

## Useful Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Shopify CLI version
shopify version

# Clear all caches
rm -rf .next node_modules package-lock.json
npm install

# Run health checks
npm run health:check

# View detailed logs
npm run dev -- --verbose
```