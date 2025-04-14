'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      
      if (code) {
        try {
          const response = await fetch('/api/auth/mobile-callback', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            router.push('/dashboard');
          } else {
            console.error('Failed to handle mobile callback');
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
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Authentication...</h1>
        <p className="text-gray-600">Please wait while we complete the sign-in process.</p>
      </div>
    </div>
  );
} 