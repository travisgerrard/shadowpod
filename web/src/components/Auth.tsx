'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      // Get the current hostname
      const hostname = window.location.hostname;
      
      // Determine the redirect URL based on the environment
      let redirectTo;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Use ngrok URL in development
        redirectTo = 'https://cdca-71-212-22-24.ngrok-free.app/dashboard';
      } else {
        // Use the current origin in production
        redirectTo = `${window.location.origin}/dashboard`;
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        setMessage({ text: error.message, type: 'error' });
        console.error('Google login error:', error);
      }
    } catch (error) {
      console.error('Google login error:', error);
      setMessage({ text: 'An unexpected error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1f2e]">
      <div className="w-full max-w-[480px] text-center">
        <div className="bg-[#242937]/80 backdrop-blur-sm rounded-[32px] shadow-2xl p-12 mx-auto">
          <h1 className="text-6xl font-bold text-white mb-8">
            ShadowPod+
          </h1>
          <p className="text-2xl text-gray-400/90 mb-16 leading-relaxed">
            Learn Japanese through<br />
            personalized stories,<br />
            shadowing,<br />
            and speaking practice.
          </p>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-3.5 bg-white rounded-2xl hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-base font-medium text-gray-700">Connecting...</span>
              </div>
            ) : (
              <>
                <img 
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="w-5 h-5 mr-3"
                />
                <span className="text-base font-medium text-gray-700">
                  Continue with Google
                </span>
              </>
            )}
          </button>

          {message && (
            <div 
              className={`mt-4 p-4 rounded-lg text-center ${
                message.type === 'success' 
                  ? 'bg-green-900 text-green-200' 
                  : 'bg-red-900 text-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Bottom Text */}
        <div className="mt-12 space-y-4">
          <p className="text-xl text-gray-400/90">
            Personalized content using your vocabulary level.
          </p>
          <p className="text-xl text-gray-400/90">
            Practice speaking with AI-powered feedback.
          </p>
        </div>
      </div>
    </div>
  );
}