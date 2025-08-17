# Production Deployment Guide

This guide covers the complete production deployment process for the Shopify Order Printer app.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Shopify Partner account with app created
- [ ] Domain name configured
- [ ] SSL certificate ready
- [ ] Production database setup
- [ ] Environment variables configured

## Deployment Options

### Option 1: Vercel Deployment (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your production values
   ```

3. **Deploy to Vercel**
   ```bash
   npm run deploy:vercel
   ```

4. **Set Environment Variables in Vercel Dashboard**
   - Go to Vercel dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.production.example`

### Option 2: Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy to Railway**
   ```bash
   npm run deploy:railway
   ```

3. **Configure Environment Variables**
   - Set variables through Railway dashboard or CLI

### Option 3: Docker Deployment

1. **Build Docker Image**
   ```bash
   npm run docker:build
   ```

2. **Configure Environment**
   ```bash
   cp .env.production.example .env
   # Edit .env with your production values
   ```

3. **Run with Docker Compose**
   ```bash
   npm run docker:run
   ```

## Environment Variables Configuration

### Required Variables

```bash
# Shopify App Configuration
SHOPIFY_API_KEY=your_production_api_key
SHOPIFY_API_SECRET=your_production_api_secret
SHOPIFY_APP_URL=https://your-domain.com
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=your_production_database_url

# Security
SESSION_SECRET=your_very_strong_session_secret_32_chars_min

# Public Variables
NEXT_PUBLIC_SHOPIFY_API_KEY=your_production_api_key
```

### Optional Variables

```bash
# GST Configuration
DEFAULT_STORE_STATE=Gujarat
DEFAULT_GST_RATES_BELOW_1000=0.05
DEFAULT_GST_RATES_ABOVE_1000=0.12

# Monitoring
SENTRY_DSN=your_sentry_dsn
WEBHOOK_MONITORING_URL=your_monitoring_webhook_url

# Performance
LOG_LEVEL=warn
ENABLE_COMPRESSION=true
```

## Database Setup

### PostgreSQL (Recommended)

1. **Create Production Database**
   ```sql
   CREATE DATABASE shopify_order_printer;
   CREATE USER shopify_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE shopify_order_printer TO shopify_user;
   ```

2. **Run Migration Script**
   ```bash
   psql -h your-host -U shopify_user -d shopify_order_printer -f scripts/setup-production-db.sql
   ```

### MySQL Alternative

1. **Create Database**
   ```sql
   CREATE DATABASE shopify_order_printer;
   CREATE USER 'shopify_user'@'%' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON shopify_order_printer.* TO 'shopify_user'@'%';
   ```

2. **Run Migration Script**
   ```bash
   mysql -h your-host -u shopify_user -p shopify_order_printer < scripts/setup-production-db.sql
   ```

## SSL Certificate Setup

### Let's Encrypt (Recommended)

```bash
# Run SSL setup script
npm run setup:ssl your-domain.com admin@your-domain.com
```

### Manual Certificate

1. Place certificate files in `./ssl/` directory:
   - `cert.pem` - Certificate file
   - `key.pem` - Private key file

2. Update Nginx configuration if using Docker

## Shopify App Configuration

1. **Update App Settings**
   - Go to Shopify Partner Dashboard
   - Update App URL to your production domain
   - Update Redirect URLs to `https://your-domain.com/api/auth`

2. **Update shopify.app.toml**
   ```toml
   application_url = "https://your-domain.com/"
   
   [auth]
   redirect_urls = [ "https://your-domain.com/api/auth" ]
   ```

3. **Deploy App Configuration**
   ```bash
   shopify app deploy
   ```

## Health Checks and Monitoring

### Health Check Endpoints

- **System Health**: `GET /api/webhooks/health?type=system`
- **Webhook Health**: `GET /api/webhooks/health`
- **Detailed Report**: `GET /api/webhooks/health?format=report`

### Monitoring Setup

1. **Configure External Monitoring**
   ```bash
   # Add to environment variables
   SENTRY_DSN=your_sentry_dsn
   WEBHOOK_MONITORING_URL=your_monitoring_webhook
   ```

2. **Set Up Alerts**
   - Configure uptime monitoring
   - Set up error rate alerts
   - Monitor response times

## Security Checklist

- [ ] SSL certificate installed and configured
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Webhook HMAC verification enabled

## Performance Optimization

- [ ] Enable compression
- [ ] Configure caching headers
- [ ] Optimize images
- [ ] Enable CDN if needed
- [ ] Monitor memory usage
- [ ] Set up database indexing

## Testing Production Deployment

1. **Health Check**
   ```bash
   curl -f https://your-domain.com/api/webhooks/health?type=system
   ```

2. **App Installation Test**
   - Install app in development store
   - Test all major features
   - Verify webhook delivery

3. **Load Testing**
   - Test with multiple concurrent requests
   - Verify database performance
   - Check memory usage

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/cert.pem -text -noout
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Environment Variable Issues**
   ```bash
   # Check environment variables
   node -e "console.log(process.env.SHOPIFY_API_KEY)"
   ```

### Log Analysis

```bash
# View application logs
npm run logs:production

# Check health status
npm run health:check
```

## Maintenance

### Regular Tasks

- [ ] Monitor application health
- [ ] Review error logs
- [ ] Update dependencies
- [ ] Renew SSL certificates
- [ ] Backup database
- [ ] Monitor disk usage

### Updates and Deployments

1. **Test in Staging**
   - Deploy to staging environment
   - Run full test suite
   - Verify functionality

2. **Production Deployment**
   - Deploy during low-traffic hours
   - Monitor health checks
   - Rollback if issues occur

## Support and Monitoring

### Key Metrics to Monitor

- Response time
- Error rate
- Memory usage
- Database performance
- Webhook delivery success rate

### Alerting Thresholds

- Response time > 5 seconds
- Error rate > 5%
- Memory usage > 80%
- Health check failures

## Rollback Procedure

1. **Immediate Rollback**
   ```bash
   # Vercel
   vercel rollback

   # Railway
   railway rollback

   # Docker
   docker-compose -f docker-compose.production.yml down
   # Deploy previous version
   ```

2. **Database Rollback**
   - Restore from backup if schema changes
   - Run rollback migrations if available

## Post-Deployment Checklist

- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] App installation working
- [ ] Webhooks being received
- [ ] Monitoring alerts configured
- [ ] Backup procedures in place
- [ ] Documentation updated
- [ ] Team notified of deployment