import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    
    if (!session || !session.isActive([])) {
      return NextResponse.json({ 
        authenticated: false,
        error: 'No valid session found'
      }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      shop: session.shop,
      scope: session.scope,
      expires: session.expires
    })
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json({ 
      authenticated: false,
      error: 'Session validation failed'
    }, { status: 500 })
  }
}