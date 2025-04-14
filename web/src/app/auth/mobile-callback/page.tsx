'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function MobileCallbackPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code for session:', error);
            router.push('/');
            return;
          }

          if (data?.session) {
            router.push('/dashboard');
          } else {
            console.error('No session data received');
            router.push('/');
          }
        } catch (error) {
          console.error('Error handling mobile callback:', error);
          router.push('/');
        }
      } else {
        router.push('/');
      }
    };

    handleCallback();
  }, [router, supabase.auth]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Authentication...</h1>
        <p className="text-gray-600">Please wait while we complete the sign-in process.</p>
      </div>
    </div>
  );
} 