import { Stack, router, useSegments } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { LogBox, View } from 'react-native';
import * as Linking from 'expo-linking';
import 'react-native-url-polyfill/auto';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

// Ignore specific warnings
LogBox.ignoreLogs([
  'URL.hostname is not implemented',
  'Possible Unhandled Promise Rejection',
]);

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments(); // Get current route segments

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true); // Mark initialization complete after first check
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Layout] Auth state changed:', _event, !!session);
      setSession(session);
      // Ensure initialized is true if the listener fires before the initial getSession completes (unlikely but safe)
      if (!initialized) setInitialized(true);
    });

    // Handle deep links (keep existing listener)
    const deepLinkSubscription = Linking.addEventListener('url', (event) => {
      console.log('Deep link received in layout:', event.url);
      // You might add logic here if layout needs to react to specific deep links
    });

    return () => {
      subscription?.unsubscribe();
      deepLinkSubscription.remove();
    };
  }, []); // Run only once on mount

  useEffect(() => {
    if (!initialized) {
      console.log('[Layout] Waiting for auth initialization...');
      return; // Don't route until initialized
    }

    const inAuthGroup = segments[0] === 'auth';
    console.log(`[Layout] Routing check: Initialized=${initialized}, Session=${!!session}, Segments=${segments.join('/')}, InAuthGroup=${inAuthGroup}`);

    // If the user is logged in and the current route is /auth, redirect away
    if (session && inAuthGroup) {
      console.log('[Layout] User logged in, redirecting from auth group to /');
      router.replace('/');
    }
    // If the user is not logged in and the current route is not /auth, redirect to /auth
    else if (!session && !inAuthGroup) {
      console.log('[Layout] User not logged in, redirecting to /auth');
      router.replace('/auth');
    } else {
      console.log('[Layout] No redirect needed.');
    }

  }, [session, initialized, segments]); // Re-run effect when session, initialization state, or route changes

  // Optionally, render a loading indicator while initializing
  if (!initialized) {
     // You can return a loading component here if desired
     console.log('[Layout] Rendering null while initializing');
     return null;
     // Or return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;
  }

  console.log('[Layout] Rendering Stack');
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      {/* Add other top-level screens/groups here if needed */}
    </Stack>
  );
}