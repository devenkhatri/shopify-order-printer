import { Session } from '@shopify/shopify-api'

// In-memory session storage for development
// In production, you should use a proper database or Redis
class MemorySessionStorage {
  private sessions: Map<string, Session> = new Map()

  async storeSession(session: Session): Promise<boolean> {
    this.sessions.set(session.id, session)
    return true
  }

  async loadSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id)
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id)
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    ids.forEach(id => this.sessions.delete(id))
    return true
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    const sessions: Session[] = []
    const sessionValues = Array.from(this.sessions.values())
    for (const session of sessionValues) {
      if (session.shop === shop) {
        sessions.push(session)
      }
    }
    return sessions
  }

  async deleteAllSessionsForShop(shop: string): Promise<number> {
    const sessions = await this.findSessionsByShop(shop)
    const sessionIds = sessions.map(session => session.id)
    
    if (sessionIds.length > 0) {
      await this.deleteSessions(sessionIds)
    }
    
    return sessionIds.length
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values())
  }

  async getSessionCount(): Promise<number> {
    return this.sessions.size
  }

  async clearAllSessions(): Promise<void> {
    this.sessions.clear()
  }
}

export const sessionStorage = new MemorySessionStorage()

// Helper function to get session from request
export async function getSession(request: Request): Promise<{ shop: string; accessToken: string } | null> {
  // This is a simplified implementation
  // In a real app, you would extract the session from cookies, headers, or other auth mechanisms
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  // For now, return a mock session
  // In production, you would validate the token and return the actual session
  return {
    shop: 'test-shop.myshopify.com',
    accessToken: 'test-token'
  }
}