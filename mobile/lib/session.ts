import { Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'shadowpod-auth-session';

export const syncSession = async (session: Session | null) => {
  if (!session) {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return;
  }

  const sessionData = JSON.stringify(session);
  await SecureStore.setItemAsync(SESSION_KEY, sessionData);
};

export const getStoredSession = async (): Promise<Session | null> => {
  try {
    const sessionData = await SecureStore.getItemAsync(SESSION_KEY);
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