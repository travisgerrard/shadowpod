import { Session } from '@supabase/supabase-js';

const SESSION_KEY = 'shadowpod-auth-session';

// Web storage implementation
const webStorage = {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  },
};

// Mobile storage implementation
const mobileStorage = {
  async getItem(key: string): Promise<string | null> {
    // @ts-ignore - This will be replaced by platform-specific implementation
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    // @ts-ignore - This will be replaced by platform-specific implementation
  },
  async removeItem(key: string): Promise<void> {
    // @ts-ignore - This will be replaced by platform-specific implementation
  },
};

// Use appropriate storage based on platform
const storage = typeof window !== 'undefined' ? webStorage : mobileStorage;

export const syncSession = async (session: Session | null) => {
  if (!session) {
    await storage.removeItem(SESSION_KEY);
    return;
  }

  const sessionData = JSON.stringify(session);
  await storage.setItem(SESSION_KEY, sessionData);
};

export const getStoredSession = async (): Promise<Session | null> => {
  try {
    const sessionData = await storage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData) as Session;
    
    // Validate session expiration
    if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      await syncSession(null);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error getting stored session:', error);
    return null;
  }
}; 