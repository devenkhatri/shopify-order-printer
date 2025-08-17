#!/bin/bash

# SSL Certificate Setup Script for Production Deployment
# This script helps set up SSL certificates for the Shopify Order Printer app

set -e

echo "🔒 Setting up SSL certificates for production deployment..."

# Configuration
DOMAIN=${1:-"your-domain.com"}
EMAIL=${2:-"admin@your-domain.com"}
SSL_DIR="./ssl"

# Check if domain is provided
if [[ "$DOMAIN" == "your-domain.com" ]]; then
    echo "❌ Please provide your domain name as the first argument"
    echo "Usage: $0 <domain> [email]"
    echo "Example: $0 myapp.example.com admin@example.com"
    exit 1
fi

# Create SSL directory
mkdir -p "$SSL_DIR"

echo "📋 SSL Certificate Setup Options:"
echo "1) Generate self-signed certificate (for testing)"
echo "2) Use Let's Encrypt (recommended for production)"
echo "3) Use existing certificate files"
echo "4) Generate certificate signing request (CSR)"
read -p "Select option (1-4): " ssl_option

case $ssl_option in
    1)
        echo "🔧 Generating self-signed certificate..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/key.pem" \
            -out "$SSL_DIR/cert.pem" \
            -subj "/C=IN/ST=Gujarat/L=Ahmedabad/O=Shopify App/OU=IT Department/CN=$DOMAIN"
        
        echo "✅ Self-signed certificate generated"
        echo "⚠️  Note: Self-signed certificates will show security warnings in browsers"
        ;;
        
    2)
        echo "🌐 Setting up Let's Encrypt certificate..."
        
        # Check if certbot is installed
        if ! command -v certbot &> /dev/null; then
            echo "Installing certbot..."
            if [[ "$OSTYPE" == "darwin"* ]]; then
                brew install certbot
            elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
                sudo apt-get update
                sudo apt-get install -y certbot
            else
                echo "❌ Please install certbot manually for your operating system"
                exit 1
            fi
        fi
        
        echo "📝 To complete Let's Encrypt setup:"
        echo "1. Ensure your domain $DOMAIN points to your server"
        echo "2. Run the following command on your production server:"
        echo ""
        echo "   sudo certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos --non-interactive"
        echo ""
        echo "3. Copy the generated certificates:"
        echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/cert.pem"
        echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/key.pem"
        echo ""
        echo "4. Set up automatic renewal:"
        echo "   sudo crontab -e"
        echo "   Add: 0 12 * * * /usr/bin/certbot renew --quiet"
        ;;
        
    3)
        echo "📁 Using existing certificate files..."
        echo "Please ensure you have the following files:"
        echo "- $SSL_DIR/cert.pem (certificate file)"
        echo "- $SSL_DIR/key.pem (private key file)"
        
        if [[ -f "$SSL_DIR/cert.pem" && -f "$SSL_DIR/key.pem" ]]; then
            echo "✅ Certificate files found"
        else
            echo "❌ Certificate files not found. Please place them in the $SSL_DIR directory"
            exit 1
        fi
        ;;
        
    4)
        echo "📝 Generating Certificate Signing Request (CSR)..."
        openssl req -new -newkey rsa:2048 -nodes \
            -keyout "$SSL_DIR/key.pem" \
            -out "$SSL_DIR/csr.pem" \
            -subj "/C=IN/ST=Gujarat/L=Ahmedabad/O=Shopify App/OU=IT Department/CN=$DOMAIN"
        
        echo "✅ CSR generated: $SSL_DIR/csr.pem"
        echo "📋 Submit the CSR to your Certificate Authority"
        echo "📋 Save the issued certificate as: $SSL_DIR/cert.pem"
        ;;
        
    *)
        echo "❌ Invalid option selected"
        exit 1
        ;;
esac

# Set proper permissions
if [[ -f "$SSL_DIR/key.pem" ]]; then
    chmod 600 "$SSL_DIR/key.pem"
    echo "🔒 Set secure permissions on private key"
fi

if [[ -f "$SSL_DIR/cert.pem" ]]; then
    chmod 644 "$SSL_DIR/cert.pem"
    echo "📜 Set permissions on certificate"
fi

# Validate certificate if both files exist
if [[ -f "$SSL_DIR/cert.pem" && -f "$SSL_DIR/key.pem" ]]; then
    echo "🔍 Validating certificate..."
    
    # Check if certificate and key match
    cert_hash=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
    key_hash=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" | openssl md5)
    
    if [[ "$cert_hash" == "$key_hash" ]]; then
        echo "✅ Certificate and private key match"
    else
        echo "❌ Certificate and private key do not match"
        exit 1
    fi
    
    # Display certificate information
    echo ""
    echo "📋 Certificate Information:"
    openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:)"
fi

echo ""
echo "🎉 SSL setup completed!"
echo ""
echo "Next steps for production deployment:"
echo "1. Update your DNS to point $DOMAIN to your server"
echo "2. Configure your reverse proxy (Nginx) to use the certificates"
echo "3. Update SHOPIFY_APP_URL environment variable to https://$DOMAIN"
echo "4. Test the SSL configuration"
echo ""
echo "Certificate files location: $SSL_DIR/"