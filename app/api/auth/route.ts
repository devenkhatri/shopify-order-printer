import { NextRequest, NextResponse } from 'next/server'
import { initiateOAuth, validateShopDomain } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Handle OAuth initiation from query parameters
    const url = new URL(request.url)
    const shop = url.searchParams.get('shop')
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 })
    }

    if (!validateShopDomain(shop)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 })
    }

    const result = await initiateOAuth(shop, request)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Redirect to Shopify OAuth page
    return NextResponse.redirect(result.redirectUrl!)
  } catch (error) {
    console.error('Auth initiation error:', error)
    return NextResponse.json({ error: 'Failed to initiate authentication' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Handle OAuth initiation from POST body
    const { shop } = await request.json()
    
    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 })
    }

    if (!validateShopDomain(shop)) {
      return NextResponse.json({ error: 'Invalid shop domain' }, { status: 400 })
    }

    const result = await initiateOAuth(shop, request)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ authUrl: result.redirectUrl })
  } catch (error) {
    console.error('Auth initiation error:', error)
    return NextResponse.json({ error: 'Failed to initiate authentication' }, { status: 500 })
  }
}