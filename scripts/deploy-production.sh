#!/bin/bash

# Production Deployment Script for Shopify Order Printer App
# This script helps set up production deployment on Vercel or Railway

set -e

echo "🚀 Starting production deployment setup..."

# Check if required tools are installed
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install npm first."
        exit 1
    fi
    
    echo "✅ Dependencies check passed"
}

# Build the application
build_app() {
    echo "🔨 Building application..."
    npm ci --production=false
    npm run build
    echo "✅ Application built successfully"
}

# Validate environment variables
validate_env() {
    echo "🔍 Validating environment variables..."
    
    required_vars=(
        "SHOPIFY_API_KEY"
        "SHOPIFY_API_SECRET"
        "SHOPIFY_APP_URL"
        "SHOPIFY_WEBHOOK_SECRET"
        "SESSION_SECRET"
        "DATABASE_URL"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo "❌ Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        echo "Please set these variables before deploying."
        exit 1
    fi
    
    echo "✅ Environment variables validation passed"
}

# Deploy to Vercel
deploy_vercel() {
    echo "🌐 Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Set production environment variables
    echo "Setting environment variables..."
    vercel env add SHOPIFY_API_KEY production
    vercel env add SHOPIFY_API_SECRET production
    vercel env add SHOPIFY_APP_URL production
    vercel env add SHOPIFY_WEBHOOK_SECRET production
    vercel env add SESSION_SECRET production
    vercel env add DATABASE_URL production
    vercel env add DEFAULT_STORE_STATE production
    vercel env add NEXT_PUBLIC_SHOPIFY_API_KEY production
    
    # Deploy
    vercel --prod
    
    echo "✅ Deployed to Vercel successfully"
}

# Deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway
    railway login
    
    # Create new project or link existing
    railway link
    
    # Set environment variables
    echo "Setting environment variables..."
    railway variables set SHOPIFY_API_KEY="$SHOPIFY_API_KEY"
    railway variables set SHOPIFY_API_SECRET="$SHOPIFY_API_SECRET"
    railway variables set SHOPIFY_APP_URL="$SHOPIFY_APP_URL"
    railway variables set SHOPIFY_WEBHOOK_SECRET="$SHOPIFY_WEBHOOK_SECRET"
    railway variables set SESSION_SECRET="$SESSION_SECRET"
    railway variables set DATABASE_URL="$DATABASE_URL"
    railway variables set DEFAULT_STORE_STATE="$DEFAULT_STORE_STATE"
    railway variables set NEXT_PUBLIC_SHOPIFY_API_KEY="$NEXT_PUBLIC_SHOPIFY_API_KEY"
    railway variables set NODE_ENV="production"
    
    # Deploy
    railway up
    
    echo "✅ Deployed to Railway successfully"
}

# Update Shopify app configuration
update_shopify_config() {
    echo "🔧 Updating Shopify app configuration..."
    
    if [[ -z "$SHOPIFY_APP_URL" ]]; then
        echo "❌ SHOPIFY_APP_URL is not set. Please set it to your production URL."
        exit 1
    fi
    
    # Update shopify.app.toml with production URL
    sed -i.bak "s|application_url = \".*\"|application_url = \"$SHOPIFY_APP_URL\"|g" shopify.app.toml
    sed -i.bak "s|redirect_urls = \[ \".*\" \]|redirect_urls = [ \"$SHOPIFY_APP_URL/api/auth\" ]|g" shopify.app.toml
    
    echo "✅ Shopify configuration updated"
}

# Main deployment function
main() {
    echo "Select deployment platform:"
    echo "1) Vercel"
    echo "2) Railway"
    echo "3) Manual setup only"
    read -p "Enter your choice (1-3): " choice
    
    check_dependencies
    
    case $choice in
        1)
            validate_env
            build_app
            update_shopify_config
            deploy_vercel
            ;;
        2)
            validate_env
            build_app
            update_shopify_config
            deploy_railway
            ;;
        3)
            build_app
            echo "✅ Manual setup completed. Please deploy manually to your chosen platform."
            ;;
        *)
            echo "❌ Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
    echo ""
    echo "🎉 Production deployment setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Update your Shopify app settings with the production URL"
    echo "2. Test the app installation in a development store"
    echo "3. Submit for Shopify app review if ready"
    echo ""
    echo "Production URL: $SHOPIFY_APP_URL"
}

# Run main function
main "$@"