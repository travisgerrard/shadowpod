'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function MobileCallback() {
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const returnTo = searchParams.get('return_to');
        
        console.log('Received auth code:', code ? 'yes' : 'no');
        console.log('Return URL:', returnTo);
        
        if (!code) {
          console.error('No code provided in callback');
          return;
        }

        console.log('Exchanging code for session...');
        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Error exchanging code for session:', error);
          throw error;
        }

        if (data?.session) {
          console.log('Session obtained, redirecting to mobile app...');
          
          // Use the return_to URL if provided, otherwise construct the default one
          const mobileUrl = returnTo 
            ? new URL(returnTo)
            : new URL('shadowpod://auth/callback');
          
          // Add the tokens to the URL
          mobileUrl.searchParams.set('access_token', data.session.access_token);
          mobileUrl.searchParams.set('refresh_token', data.session.refresh_token);

          const redirectUrl = mobileUrl.toString();
          console.log('Redirecting to:', redirectUrl.replace(/[?&]access_token=[^&]+/, '?access_token=REDACTED'));

          // Redirect back to the mobile app
          window.location.href = redirectUrl;
        } else {
          console.error('No session data received');
        }
      } catch (error) {
        console.error('Error handling mobile callback:', error);
      }
    };

    handleCallback();
  }, [searchParams, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1f2e]">
      <div className="text-white text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting back to ShadowPod+...</h1>
        <p className="text-gray-400">Please wait while we complete the authentication.</p>
      </div>
    </div>
  );
} 