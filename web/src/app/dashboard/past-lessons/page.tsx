'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import DailyStory from '@/components/DailyStory';
import ShadowingPractice from '@/components/ShadowingPractice';
import SpeakingPrompts from '@/components/SpeakingPrompts';
import { StoryContent, GeneratedContent, ShadowingSegment, SpeakingPrompt } from '@/lib/types';

interface SavedContent {
  id: string;
  created_at: string;
  story: {
    id: string;
    content: StoryContent;
  };
  shadowing?: {
    id: string;
    segments: ShadowingSegment[];
  };
  prompts?: {
    id: string;
    prompts: SpeakingPrompt[];
  };
}

export default function PastLessons() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('story');
  const [currentContent, setCurrentContent] = useState<GeneratedContent | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error('Auth error:', error);
        router.push('/');
        return false;
      }
      
      return true;
    };

    const loadSavedContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;

        const { data: { session } } = await supabase.auth.getSession();
        
        // Get all stories for the user
        const { data: storyModules, error: storyError } = await supabase
          .from('user_modules')
          .select('id, content, created_at')
          .eq('user_id', session!.user.id)
          .eq('module_type', 'story')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (storyError) {
          console.error('Error fetching stories:', storyError);
          setError('Failed to load past content');
          return;
        }

        // For each story, format the date and collect the content
        const formattedContent: SavedContent[] = storyModules.map(storyModule => {
          const date = new Date(storyModule.created_at);
          const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          
          return {
            id: storyModule.id,
            created_at: formattedDate,
            story: {
              id: storyModule.id,
              content: storyModule.content as StoryContent
            }
          };
        });

        setSavedContent(formattedContent);
        
        // If there are stories, select the first one by default
        if (formattedContent.length > 0) {
          setSelectedContentId(formattedContent[0].id);
        }
      } catch (err) {
        console.error('Error loading saved content:', err);
        setError('An error occurred while loading saved content');
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedContent();
  }, [router]);

  // Load associated content when a story is selected
  useEffect(() => {
    const loadAssociatedContent = async () => {
      if (!selectedContentId) return;

      try {
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        // Find the selected story
        const selectedStory = savedContent.find(content => content.id === selectedContentId);
        if (!selectedStory) return;
        
        // Get associated shadowing content
        const { data: shadowingData, error: shadowingError } = await supabase
          .from('user_modules')
          .select('id, content')
          .eq('user_id', session.user.id)
          .eq('module_type', 'shadowing')
          .eq('content->>storyId', selectedContentId)
          .single();
          
        if (shadowingError && shadowingError.code !== 'PGRST116') {
          console.error('Error fetching shadowing data:', shadowingError);
        }
        
        // Get associated prompts
        const { data: promptsData, error: promptsError } = await supabase
          .from('user_modules')
          .select('id, content')
          .eq('user_id', session.user.id)
          .eq('module_type', 'prompt')
          .eq('content->>storyId', selectedContentId)
          .single();
          
        if (promptsError && promptsError.code !== 'PGRST116') {
          console.error('Error fetching prompts data:', promptsError);
        }

        // Verify story content structure
        const storyContent = selectedStory.story.content;
        if (!storyContent || !storyContent.title || !storyContent.title.japanese || !storyContent.title.english) {
          console.error('Invalid story content structure:', storyContent);
          // Create a minimal valid structure if needed
          const fixedStoryContent: StoryContent = {
            title: {
              japanese: storyContent?.title?.japanese || 'タイトルなし',
              english: storyContent?.title?.english || 'No Title'
            },
            japanese: storyContent?.japanese || 'コンテンツがありません',
            english: storyContent?.english || 'No content available'
          };
          
          // Build the complete content object with fixed story content
          setCurrentContent({
            story: fixedStoryContent,
            shadowingSegments: shadowingData?.content?.segments || [],
            speakingPrompts: promptsData?.content?.prompts || []
          });
        } else {
          // Build the complete content object with original story content
          setCurrentContent({
            story: storyContent,
            shadowingSegments: shadowingData?.content?.segments || [],
            speakingPrompts: promptsData?.content?.prompts || []
          });
        }
        
      } catch (error) {
        console.error('Error loading associated content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssociatedContent();
  }, [selectedContentId, savedContent]);

  const handleContentSelect = (contentId: string) => {
    setSelectedContentId(contentId);
    setActiveTab('story'); // Reset to story tab when changing content
  };

  const renderTabContent = () => {
    if (!currentContent) {
      return <div className="p-4 text-center">No content selected</div>;
    }
    
    switch (activeTab) {
      case 'story':
        return currentContent.story ? <DailyStory story={currentContent.story} /> : 
               <div className="p-4 text-center">Story content not available</div>;
      case 'shadowing':
        return currentContent.shadowingSegments && currentContent.shadowingSegments.length > 0 ? 
               <ShadowingPractice segments={currentContent.shadowingSegments} /> : 
               <div className="p-4 text-center">Shadowing content not available</div>;
      case 'speaking':
        return currentContent.speakingPrompts && currentContent.speakingPrompts.length > 0 ? 
               <SpeakingPrompts prompts={currentContent.speakingPrompts} /> : 
               <div className="p-4 text-center">Speaking prompts not available</div>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Past Lessons</h1>
        <Link 
          href="/dashboard"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Back to Dashboard
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left sidebar - List of saved content */}
          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-min">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Saved Lessons</h2>
            {savedContent.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No saved lessons found</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {savedContent.map((content) => (
                  <li key={content.id}>
                    <button
                      onClick={() => handleContentSelect(content.id)}
                      className={`w-full text-left p-2 rounded-md ${
                        selectedContentId === content.id
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <p className="font-medium truncate">
                        {content.story?.content?.title?.japanese || 'Untitled Lesson'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{content.created_at}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Right section - Content display */}
          <div className="md:col-span-3">
            {selectedContentId && (
              <>
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                  <button
                    className={`py-2 px-4 font-medium ${
                      activeTab === 'story'
                        ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab('story')}
                  >
                    Story
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
                {renderTabContent()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 