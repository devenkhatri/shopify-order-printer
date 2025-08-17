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
}

export const sessionStorage = new MemorySessionStorage()