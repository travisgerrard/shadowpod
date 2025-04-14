import { Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'shadowpod-auth-session';

// Mobile storage implementation using SecureStore
const storage = {
  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

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