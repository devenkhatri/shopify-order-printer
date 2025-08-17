#!/bin/bash

# Local Development Setup Script
# This script helps set up the Shopify Order Printer app for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Shopify Order Printer for local development...${NC}"
echo ""

# Check if required tools are installed
check_dependencies() {
    echo -e "${BLUE}📋 Checking dependencies...${NC}"
    
    missing_tools=()
    
    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js 18+")
    else
        node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $node_version -lt 18 ]]; then
            missing_tools+=("Node.js 18+ (current: $(node -v))")
        fi
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    if ! command -v shopify &> /dev/null; then
        missing_tools+=("Shopify CLI")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing required tools:${NC}"
        printf '%s\n' "${missing_tools[@]}"
        echo ""
        echo -e "${YELLOW}Please install the missing tools:${NC}"
        echo "- Node.js 18+: https://nodejs.org/en/download/"
        echo "- Shopify CLI: https://shopify.dev/docs/apps/tools/cli/installation"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All dependencies are installed${NC}"
}

# Install npm dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing npm dependencies...${NC}"
    
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi
    
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
}

# Set up environment variables
setup_environment() {
    echo -e "${BLUE}⚙️  Setting up environment variables...${NC}"
    
    if [[ -f ".env.local" ]]; then
        echo -e "${YELLOW}⚠️  .env.local already exists. Backing up to .env.local.backup${NC}"
        cp .env.local .env.local.backup
    fi
    
    # Copy example file
    cp .env.example .env.local
    
    echo -e "${GREEN}✅ Environment file created: .env.local${NC}"
    echo ""
    echo -e "${YELLOW}🔧 You need to configure the following variables in .env.local:${NC}"
    echo ""
    echo "1. SHOPIFY_API_KEY - Get from Shopify Partner Dashboard"
    echo "2. SHOPIFY_API_SECRET - Get from Shopify Partner Dashboard"
    echo "3. SHOPIFY_WEBHOOK_SECRET - Generate a secure secret"
    echo "4. SESSION_SECRET - Generate a secure secret"
    echo ""
    echo -e "${BLUE}💡 Generate secure secrets using:${NC}"
    echo "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
}

# Generate secure secrets
generate_secrets() {
    echo -e "${BLUE}🔐 Generating secure secrets...${NC}"
    
    # Generate session secret
    session_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    webhook_secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Update .env.local with generated secrets
    if [[ -f ".env.local" ]]; then
        # Replace placeholder secrets with generated ones
        sed -i.bak "s/your_very_strong_session_secret_minimum_32_characters_long/$session_secret/g" .env.local
        sed -i.bak "s/your_webhook_secret_here_minimum_32_chars/$webhook_secret/g" .env.local
        rm .env.local.bak
        
        echo -e "${GREEN}✅ Secure secrets generated and added to .env.local${NC}"
        echo ""
        echo -e "${YELLOW}📝 Generated secrets:${NC}"
        echo "SESSION_SECRET: $session_secret"
        echo "SHOPIFY_WEBHOOK_SECRET: $webhook_secret"
        echo ""
        echo -e "${BLUE}💾 These secrets have been automatically added to your .env.local file${NC}"
    fi
}

# Set up database
setup_database() {
    echo -e "${BLUE}🗄️  Setting up database...${NC}"
    
    # Create uploads directory
    mkdir -p uploads
    
    # For SQLite, just ensure the directory is writable
    if [[ ! -w "." ]]; then
        echo -e "${RED}❌ Current directory is not writable. Please check permissions.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Database setup completed (SQLite will be created automatically)${NC}"
}

# Validate setup
validate_setup() {
    echo -e "${BLUE}🔍 Validating setup...${NC}"
    
    # Check if .env.local exists and has required variables
    if [[ ! -f ".env.local" ]]; then
        echo -e "${RED}❌ .env.local file not found${NC}"
        return 1
    fi
    
    required_vars=(
        "SHOPIFY_API_KEY"
        "SHOPIFY_API_SECRET"
        "SESSION_SECRET"
        "SHOPIFY_WEBHOOK_SECRET"
        "NEXT_PUBLIC_SHOPIFY_API_KEY"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env.local || grep -q "^$var=your_" .env.local; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  The following variables still need to be configured:${NC}"
        printf '%s\n' "${missing_vars[@]}"
        echo ""
        echo -e "${BLUE}📖 See LOCAL_DEVELOPMENT_SETUP.md for detailed instructions${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Environment validation passed${NC}"
    return 0
}

# Display next steps
show_next_steps() {
    echo ""
    echo -e "${GREEN}🎉 Local development setup completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo ""
    echo "1. 🏪 Create a Shopify app in your Partner Dashboard:"
    echo "   https://partners.shopify.com/"
    echo ""
    echo "2. ⚙️  Update .env.local with your app credentials:"
    echo "   - SHOPIFY_API_KEY (from Partner Dashboard)"
    echo "   - SHOPIFY_API_SECRET (from Partner Dashboard)"
    echo "   - NEXT_PUBLIC_SHOPIFY_API_KEY (same as API key)"
    echo ""
    echo "3. 🚀 Start the development server:"
    echo "   npm run dev"
    echo ""
    echo "4. 📖 For detailed setup instructions, see:"
    echo "   LOCAL_DEVELOPMENT_SETUP.md"
    echo ""
    echo -e "${YELLOW}💡 Tip: The Shopify CLI will automatically update your app URLs during development${NC}"
}

# Main setup function
main() {
    check_dependencies
    echo ""
    
    install_dependencies
    echo ""
    
    setup_environment
    echo ""
    
    read -p "$(echo -e ${BLUE}🔐 Generate secure secrets automatically? [Y/n]: ${NC})" -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        generate_secrets
        echo ""
    fi
    
    setup_database
    echo ""
    
    if validate_setup; then
        show_next_steps
    else
        echo ""
        echo -e "${YELLOW}⚠️  Setup completed but some configuration is still needed.${NC}"
        echo -e "${BLUE}📖 Please see LOCAL_DEVELOPMENT_SETUP.md for detailed instructions.${NC}"
    fi
}

# Run main function
main "$@"