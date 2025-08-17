import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for Shopify shop parameter
  const shop = request.nextUrl.searchParams.get('shop')
  const host = request.nextUrl.searchParams.get('host')

  // For embedded app, ensure we have shop and host parameters
  if (!shop && pathname !== '/') {
    const redirectUrl = new URL('/api/auth', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Set security headers for embedded app
  const response = NextResponse.next()
  
  // Allow embedding in Shopify admin
  response.headers.set('X-Frame-Options', 'ALLOWALL')
  
  // Set CSP for Shopify embedded apps
  response.headers.set(
    'Content-Security-Policy',
    [
      "frame-ancestors https://*.myshopify.com https://admin.shopify.com",
      "connect-src 'self' https://*.myshopify.com https://monorail-edge.shopifysvc.com",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com",
      "style-src 'self' 'unsafe-inline' https://cdn.shopify.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com https://cdn.shopify.com",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ')
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - api/webhooks (webhook routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico).*)',
  ],
}