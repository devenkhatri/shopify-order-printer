import { NextRequest, NextResponse } from 'next/server'
import { handleOAuthCallback } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const result = await handleOAuthCallback(request)
    
    if (!result.success) {
      console.error('OAuth callback failed:', result.error)
      return NextResponse.redirect(new URL('/auth/error?message=' + encodeURIComponent(result.error || 'Authentication failed'), request.url))
    }

    const session = result.session!
    const shop = session.shop

    // Store session information (already handled by sessionStorage in shopify config)
    console.log('OAuth successful for shop:', shop)

    // Redirect to app with shop parameter
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('shop', shop)
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/auth/error?message=' + encodeURIComponent('Authentication failed'), request.url))
  }
}