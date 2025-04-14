'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Settings() {
  const router = useRouter();
  const [apiToken, setApiToken] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Load user settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Check auth
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError || !session) {
          console.error('Auth error:', authError);
          router.push('/');
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('wanikani_api_token, selected_wanikani_level')
          .eq('id', session.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
          return;
        }
        
        if (profile) {
          if (profile.wanikani_api_token) setApiToken(profile.wanikani_api_token);
          if (profile.selected_wanikani_level) setSelectedLevel(profile.selected_wanikani_level);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, [router]);

  const handleSaveToken = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      
      // Check auth
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        console.error('Auth error:', authError);
        setMessage({text: 'Authentication error. Please sign in again.', type: 'error'});
        router.push('/');
        return;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: session.user.id,
          wanikani_api_token: apiToken,
          selected_wanikani_level: selectedLevel,
          updated_at: new Date().toISOString()
        });
      
      if (updateError) {
        console.error('Error updating profile:', updateError);
        setMessage({text: `Failed to save settings: ${updateError.message}`, type: 'error'});
        return;
      }
      
      setMessage({text: 'Settings saved successfully!', type: 'success'});
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({text: 'An unexpected error occurred.', type: 'error'});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">WaniKani Settings</h1>
        <Link 
          href="/dashboard"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Back to Dashboard
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Vocabulary Level</h2>
        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-5 w-5 text-indigo-600"
              checked={!!apiToken}
              onChange={(e) => e.target.checked ? setApiToken('f0c916d8-699f-445c-a80c-1bd8b8432bbe') : setApiToken('')}
            />
            <span className="ml-2 text-gray-700 dark:text-gray-300">Use WaniKani API</span>
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            If enabled, content will be generated based on your WaniKani vocabulary.
          </p>
        </div>

        {(apiToken || apiToken === '') && (
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              WaniKani API Token
            </label>
            <input
              type="text"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter your WaniKani API token"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Get your token from your WaniKani account settings
            </p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Default Level (used if WaniKani API is disabled)
          </label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="N5">JLPT N5 (Beginner)</option>
            <option value="N4">JLPT N4 (Basic)</option>
            <option value="N3">JLPT N3 (Intermediate)</option>
            <option value="N2">JLPT N2 (Advanced)</option>
            <option value="N1">JLPT N1 (Proficient)</option>
          </select>
        </div>

        <button
          onClick={handleSaveToken}
          disabled={isLoading}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
} 