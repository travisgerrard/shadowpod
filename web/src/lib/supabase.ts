import { createClient } from '@supabase/supabase-js';
import { syncSession } from '../shared/session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: async (key) => {
        if (typeof window === 'undefined') {
          return null;
        }
        return localStorage.getItem(key);
      },
      setItem: async (key, value) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, value);
          try {
            const session = JSON.parse(value);
            await syncSession(session);
          } catch (error) {
            console.error('Error syncing session:', error);
          }
        }
      },
      removeItem: async (key) => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
          await syncSession(null);
        }
      },
    },
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
});

export default supabase; 