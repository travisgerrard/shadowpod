'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { n5Vocab, n5Grammar } from '@/data/vocab-n5';
import { GeneratedContent } from '@/lib/types';
import DailyStory from '@/components/DailyStory';
import ShadowingPractice from '@/components/ShadowingPractice';
import SpeakingPrompts from '@/components/SpeakingPrompts';
import Link from 'next/link';

// Type for WaniKani API response
interface WaniKaniAssignment {
  data: {
    subject_type: string;
    subject_id: string;
    passed_at: string | null;
    burned_at: string | null;
  };
}

interface WaniKaniResponse {
  data: WaniKaniAssignment[];
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('story');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
          router.push('/');
          return;
        }
        
        if (!session) {
          console.log('No active session found, redirecting to login');
          router.push('/');
          return;
        }
        
        // Check if token is going to expire in the next hour (3600 seconds)
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const oneHourFromNow = now + 3600;
        
        // If token expires in less than an hour, refresh it proactively
        if (expiresAt && expiresAt < oneHourFromNow) {
          console.log('Token will expire soon, refreshing proactively');
          // Refresh token to ensure it's valid
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Token refresh error:', refreshError);
            // Only redirect if refresh failed with a clear error
            if (refreshError.message !== 'Failed to fetch') {
              router.push('/');
              return;
            }
          }
          
          if (!refreshData.session) {
            console.log('Failed to refresh session, redirecting to login');
            router.push('/');
            return;
          }
          
          console.log('Session refreshed successfully');
        } else {
          console.log('Session still valid, no refresh needed');
        }
      } catch (err) {
        console.error('Authentication check error:', err);
        router.push('/');
      }
    };
    
    checkAuth();
    
    // Set up a periodic refresh check every 30 minutes to keep the session alive
    const refreshInterval = setInterval(checkAuth, 30 * 60 * 1000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [router]);

  // Load or generate content
  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if we have today's content
        const today = new Date().toISOString().split('T')[0];
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        // Load user settings first
        await loadUserSettings(session.user.id);
        
        // Try to get today's story from DB
        const { data: storyData, error: storyError } = await supabase
          .from('user_modules')
          .select('id, content')
          .eq('user_id', session.user.id)
          .eq('module_type', 'story')
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59.999Z`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (storyError && storyError.code !== 'PGRST116') {
          // Error other than "no rows returned" - log it
          console.error('Error fetching story:', storyError);
          setDebugInfo(`Story fetch error: ${storyError.message} (${storyError.code})`);
        }
        
        if (storyData) {
          console.log('Found existing story for today');
          // We have a story for today, get the associated shadowing and prompts
          const { data: shadowingData, error: shadowingError } = await supabase
            .from('user_modules')
            .select('id, content')
            .eq('user_id', session.user.id)
            .eq('module_type', 'shadowing')
            .eq('content->>storyId', storyData.id)
            .single();
          
          if (shadowingError) {
            console.error('Error fetching shadowing data:', shadowingError);
          }
          
          const { data: promptsData, error: promptsError } = await supabase
            .from('user_modules')
            .select('id, content')
            .eq('user_id', session.user.id)
            .eq('module_type', 'prompt')
            .eq('content->>storyId', storyData.id)
            .single();
          
          if (promptsError) {
            console.error('Error fetching prompts data:', promptsError);
          }
          
          if (shadowingData && promptsData) {
            setContent({
              story: storyData.content,
              shadowingSegments: shadowingData.content.segments,
              speakingPrompts: promptsData.content.prompts,
            });
            return;
          }
        }
        
        // No content for today, generate new content
        console.log('No content found for today, generating new content');
        await generateContent();
      } catch (error) {
        console.error('Error loading content:', error);
        setError('Failed to load content. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContent();
  }, []);

  const generateContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo(null);
      
      // Check authentication first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        setError(`Authentication error: ${authError.message}`);
        console.error('Auth error:', authError);
        router.push('/');
        return;
      }
      
      if (!session) {
        setError('Not authenticated. Please sign in again.');
        console.error('No active session found');
        router.push('/');
        return;
      }
      
      // Check if we already generated content today (double-check)
      const today = new Date().toISOString().split('T')[0];
      const { data: existingStory } = await supabase
        .from('user_modules')
        .select('id, content')
        .eq('user_id', session.user.id)
        .eq('module_type', 'story')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .limit(1)
        .single();
        
      if (existingStory) {
        console.log('Content was already generated today, fetching existing content...');
        
        // Fetch associated content instead of reloading
        const { data: shadowingData } = await supabase
          .from('user_modules')
          .select('id, content')
          .eq('user_id', session.user.id)
          .eq('module_type', 'shadowing')
          .eq('content->>storyId', existingStory.id)
          .single();
          
        const { data: promptsData } = await supabase
          .from('user_modules')
          .select('id, content')
          .eq('user_id', session.user.id)
          .eq('module_type', 'prompt')
          .eq('content->>storyId', existingStory.id)
          .single();
          
        const fullContent = {
          story: existingStory.content,
          shadowingSegments: shadowingData?.content?.segments || [],
          speakingPrompts: promptsData?.content?.prompts || []
        };
        
        setContent(fullContent);
        setIsLoading(false);
        return;
      }
      
      // Ensure we have a fresh token
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        setError(`Session refresh failed: ${refreshError.message}`);
        console.error('Session refresh error:', refreshError);
        router.push('/');
        return;
      }
      
      if (!refreshData.session) {
        setError('Could not refresh session. Please sign in again.');
        console.error('No session after refresh');
        router.push('/');
        return;
      }
      
      // Prepare vocab and grammar
      let vocab: string[] = [];
      let grammar: string[] = [];
      
      if (apiToken) {
        // Use WaniKani API
        try {
          const response = await fetch(`https://api.wanikani.com/v2/assignments?learned=true`, {
            headers: {
              'Authorization': `Bearer ${apiToken}`,
            },
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch from WaniKani API');
          }
          
          const data = await response.json() as WaniKaniResponse;
          
          // Extract vocabulary items
          const learnedItems = data.data
            .filter((item: WaniKaniAssignment) => item.data.subject_type === 'vocabulary' && 
                           (item.data.passed_at || item.data.burned_at))
            .map((item: WaniKaniAssignment) => item.data.subject_id);
          
          // Get 5 random items
          const randomIndices = Array.from({ length: Math.min(5, learnedItems.length) }, 
                                () => Math.floor(Math.random() * learnedItems.length));
          
          vocab = randomIndices.map(i => learnedItems[i]);
        } catch (error) {
          console.error('Error fetching from WaniKani:', error);
          // Fall back to local vocab list
          vocab = getRandomItems(n5Vocab, 5).map(item => item.japanese);
        }
      } else {
        // Use local vocab list based on selected level
        vocab = getRandomItems(n5Vocab, 5).map(item => item.japanese);
      }
      
      // Get random grammar points
      grammar = getRandomItems(n5Grammar, 3).map(item => item.pattern);
      
      // Log what we're sending for debugging
      setDebugInfo(`Generating content with: Vocab: ${vocab.join(', ')}, Grammar: ${grammar.join(', ')}, Level: ${selectedLevel}`);
      
      // Call the Supabase Edge Function directly instead of using the API route
      console.log('Calling edge function directly with session token');
      const { data, error } = await supabase.functions.invoke<GeneratedContent>('generate-content', {
        body: { vocab, grammar, wanikaniLevel: selectedLevel },
      });
      
      if (error) {
        console.error('Edge function error:', error);
        setDebugInfo(`Supabase Function Error: ${JSON.stringify(error)}`);
        throw new Error(`Failed to generate content: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data returned from content generation');
      }
      
      setContent(data);
    } catch (error) {
      console.error('Error generating content:', error);
      setError(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getRandomItems = <T,>(items: T[], count: number): T[] => {
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const renderTabContent = () => {
    if (!content) {
      return <div className="p-4 text-center">No content available</div>;
    }
    
    switch (activeTab) {
      case 'story':
        return <DailyStory story={content.story} />;
      case 'shadowing':
        return <ShadowingPractice segments={content.shadowingSegments} />;
      case 'speaking':
        return <SpeakingPrompts prompts={content.speakingPrompts} />;
      default:
        return null;
    }
  };

  // Load user settings from the database
  const loadUserSettings = async (userId: string) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('wanikani_api_token, selected_wanikani_level')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error loading user settings:', error);
        return;
      }
      
      if (userProfile) {
        if (userProfile.wanikani_api_token) {
          setApiToken(userProfile.wanikani_api_token);
        }
        
        if (userProfile.selected_wanikani_level) {
          setSelectedLevel(userProfile.selected_wanikani_level);
        }
      }
    } catch (error) {
      console.error('Error in loadUserSettings:', error);
    }
  };

  return (
    <main className="flex flex-col p-4 max-w-4xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ShadowPod+</h1>
        <div className="flex space-x-4 items-center">
          <Link href="/dashboard/past-lessons" className="text-blue-500 hover:text-blue-700">
            Past Lessons
          </Link>
          <Link href="/dashboard/settings" 
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md">
            WaniKani Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'story'
                ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('story')}
          >
            Daily Story
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'shadowing'
                ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('shadowing')}
          >
            Shadowing
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'speaking'
                ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('speaking')}
          >
            Speaking
          </button>
        </div>
        <Link href="/dashboard/past-lessons" className="px-4 py-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 border border-indigo-600 dark:border-indigo-400 rounded-md">
          View Past Lessons
        </Link>
      </div>
      
      {isLoading ? (
        <div className="text-center p-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md mb-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          {debugInfo && (
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-800 rounded text-xs font-mono overflow-auto">
              <p className="text-red-700 dark:text-red-300">{debugInfo}</p>
            </div>
          )}
          <button
            onClick={generateContent}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      ) : (
        renderTabContent()
      )}
      
      <div className="mt-6 text-center">
        <button
          onClick={generateContent}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
          disabled={isLoading}
        >
          Generate New Content
        </button>
      </div>
      
      {debugInfo && !error && (
        <div className="mt-4 p-2 border border-gray-200 dark:border-gray-700 rounded-md">
          <details>
            <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">Debug Info</summary>
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto">
              <p className="text-gray-700 dark:text-gray-300">{debugInfo}</p>
            </div>
          </details>
        </div>
      )}
    </main>
  );
} 