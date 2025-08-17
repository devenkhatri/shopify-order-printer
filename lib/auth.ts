import { NextRequest } from 'next/server'
import { shopify } from './shopify'
import { Session } from '@shopify/shopify-api'

export interface AuthResult {
  success: boolean
  session?: Session
  error?: string
  redirectUrl?: string
}

export async function initiateOAuth(shop: string, request: NextRequest): Promise<AuthResult> {
  try {
    // Validate shop domain
    if (!shop || !shop.includes('.myshopify.com')) {
      return {
        success: false,
        error: 'Invalid shop domain'
      }
    }

    // Begin OAuth flow
    const authUrl = await shopify.auth.begin({
      shop,
      callbackPath: '/api/auth/callback',
      isOnline: false, // Use offline tokens for background operations
      rawRequest: request,
    })

    return {
      success: true,
      redirectUrl: authUrl
    }
  } catch (error) {
    console.error('OAuth initiation error:', error)
    return {
      success: false,
      error: 'Failed to initiate OAuth flow'
    }
  }
}

export async function handleOAuthCallback(request: NextRequest): Promise<AuthResult> {
  try {
    const url = new URL(request.url)
    const shop = url.searchParams.get('shop')
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!shop || !code) {
      return {
        success: false,
        error: 'Missing required OAuth parameters'
      }
    }

    // Complete OAuth flow and get session
    const callbackResponse = await shopify.auth.callback({
      rawRequest: request,
    })

    if (!callbackResponse.session) {
      return {
        success: false,
        error: 'Failed to create session'
      }
    }

    return {
      success: true,
      session: callbackResponse.session
    }
  } catch (error) {
    console.error('OAuth callback error:', error)
    return {
      success: false,
      error: 'OAuth callback failed'
    }
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<Session | null> {
  try {
    const url = new URL(request.url)
    const shop = url.searchParams.get('shop')
    
    if (!shop) {
      return null
    }

    // Try to find an existing session for this shop
    const sessions = await shopify.config.sessionStorage?.findSessionsByShop(shop)
    
    if (!sessions || sessions.length === 0) {
      return null
    }

    // Return the most recent valid session
    const validSessions = sessions.filter((session: Session) => session.isActive(shopify.config.scopes))
    return validSessions.length > 0 ? validSessions[0] : null
  } catch (error) {
    console.error('Error getting session from request:', error)
    return null
  }
}

export function validateShopDomain(shop: string): boolean {
  if (!shop) return false
  
  // Basic validation for Shopify shop domain
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/
  return shopRegex.test(shop)
}