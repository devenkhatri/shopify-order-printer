import { NextRequest, NextResponse } from 'next/server'
import { shopify } from '@/lib/shopify'

export async function GET(request: NextRequest) {
  try {
    // Handle Shopify OAuth callback
    const url = new URL(request.url)
    const shop = url.searchParams.get('shop')
    const code = url.searchParams.get('code')
    
    if (!shop || !code) {
      return NextResponse.json({ error: 'Missing shop or code parameter' }, { status: 400 })
    }

    // Exchange code for access token
    const session = await shopify.auth.callback({
      rawRequest: request,
      rawResponse: NextResponse,
    })

    return NextResponse.redirect(new URL(`/?shop=${shop}`, request.url))
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Handle OAuth initiation
    const { shop } = await request.json()
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 })
    }

    const authUrl = await shopify.auth.begin({
      shop,
      callbackPath: '/api/auth',
      isOnline: false,
      rawRequest: request,
      rawResponse: NextResponse,
    })

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Auth initiation error:', error)
    return NextResponse.json({ error: 'Failed to initiate authentication' }, { status: 500 })
  }
}