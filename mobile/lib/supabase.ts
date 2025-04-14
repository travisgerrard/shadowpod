import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Get the environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // mobile apps should set this to false
    storage: {
      getItem: async (key: string): Promise<string | null> => {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (e) {
          console.error('Error getting item from SecureStore:', e);
          return null;
        }
      },
      setItem: async (key: string, value: string): Promise<void> => {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (e) {
          console.error('Error setting item in SecureStore:', e);
        }
      },
      removeItem: async (key: string): Promise<void> => {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (e) {
          console.error('Error removing item from SecureStore:', e);
        }
      },
    },
  },
});

export default supabase; 