/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile Shopify Polaris and related packages for proper SSR support
  transpilePackages: [
    '@shopify/polaris',
    '@shopify/app-bridge',
    '@shopify/app-bridge-react'
  ],
  
  // Experimental features for better React 18 support
  experimental: {
    esmExternals: 'loose',
  },
  // Configure for Shopify embedded app
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/(.*)',
        headers: [
          // Content Security Policy for Shopify embedded apps
          {
            key: 'Content-Security-Policy',
            value: [
              "frame-ancestors https://*.myshopify.com https://admin.shopify.com",
              "connect-src 'self' https://*.myshopify.com https://monorail-edge.shopifysvc.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com",
              "style-src 'self' 'unsafe-inline' https://cdn.shopify.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com https://cdn.shopify.com",
              "object-src 'none'",
              "base-uri 'self'"
            ].join('; ')
          },
          // X-Frame-Options for embedded app
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Enable XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ]
  },

  // Configure webpack for Shopify dependencies
  webpack: (config, { isServer }) => {
    // Resolve fallbacks for Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }

    return config
  },

  // Environment variables
  env: {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
  },

  // Public runtime config for client-side access
  publicRuntimeConfig: {
    SHOPIFY_API_KEY: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
  },

  // Server runtime config for server-side access
  serverRuntimeConfig: {
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
    SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
  },

  // Optimize images for Shopify assets
  images: {
    domains: [
      'cdn.shopify.com',
      '*.myshopify.com',
      'shopify-assets.s3.amazonaws.com'
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Enable compression
  compress: true,

  // Configure redirects for Shopify app installation
  async redirects() {
    return [
      {
        source: '/install',
        destination: '/api/auth',
        permanent: false,
      },
    ]
  },

  // Configure rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/webhooks/:path*',
        destination: '/api/webhooks/:path*',
      },
    ]
  },
}

export default nextConfig