import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import tw from 'twrnc';
import DailyStory from '../../components/DailyStory';
import ShadowingPractice from '../../components/ShadowingPractice';
import SpeakingPrompts from '../../components/SpeakingPrompts';
import { StoryContent, ShadowingSegment, SpeakingPrompt, GeneratedContent, UserProfile } from 'shadowpod-shared/lib/types';
import { supabase } from '../../lib/supabase';
import { n5Vocab, n5Grammar } from '../../data/vocab-n5';

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

export default function HomeScreen() {
  const [dailyStory, setDailyStory] = useState<StoryContent | null>(null);
  const [shadowingSegments, setShadowingSegments] = useState<ShadowingSegment[] | null>(null);
  const [speakingPrompts, setSpeakingPrompts] = useState<SpeakingPrompt[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [apiToken, setApiToken] = useState<string | null>(null);

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

  // Get random items from an array
  const getRandomItems = <T,>(items: T[], count: number): T[] => {
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  useEffect(() => {
    const fetchStory = async () => {
      setIsLoading(true);
      setError(null);
      setDailyStory(null);
      setShadowingSegments(null);
      setSpeakingPrompts(null);

      try {
        // Ensure we have an authenticated client
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated");
        }

        // Load user settings first
        await loadUserSettings(session.user.id);

        // First, check if we have content for today
        const today = new Date().toISOString().split('T')[0];
        const { data: storyData, error: storyError } = await supabase
          .from('user_modules')
          .select('id, content')
          .eq('user_id', session.user.id)
          .eq('module_type', 'story')
          .gte('created_at', today)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (storyError && storyError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching story data:', storyError);
          throw new Error('Failed to fetch existing content');
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
            setDailyStory(storyData.content);
            setShadowingSegments(shadowingData.content.segments);
            setSpeakingPrompts(promptsData.content.prompts);
            setIsLoading(false);
            return;
          }
        }

        // No content for today, generate new content
        console.log('No content found for today, generating new content');
        
        // Prepare vocab and grammar based on user settings
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
              .filter((item) => item.data.subject_type === 'vocabulary' && 
                             (item.data.passed_at || item.data.burned_at))
              .map((item) => item.data.subject_id);
            
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

        const params = {
          vocab,
          grammar,
          wanikaniLevel: selectedLevel
        };

        const { data, error: functionError } = await supabase.functions.invoke<GeneratedContent>('generate-content', {
          body: params,
        });

        if (functionError) {
          console.error('Edge function returned error:', functionError);
          let errMsg = `Failed to generate content.`;
          if (functionError.context && typeof functionError.context === 'object' && 'message' in functionError.context) {
            errMsg += ` Error: ${functionError.context.message}`;
          } else if (functionError.message) {
            errMsg += ` Error: ${functionError.message}`;
          }
          throw new Error(errMsg);
        }

        if (!data || !data.story) {
          console.error('No story data returned from edge function:', data);
          throw new Error('No story content generated.');
        }

        console.log('Successfully received generated content:', data);
        setDailyStory(data.story);
        setShadowingSegments(data.shadowingSegments);
        setSpeakingPrompts(data.speakingPrompts);

      } catch (err: any) {
        console.error("Error fetching story:", err);
        setError(err.message || "Failed to load the daily story.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, []);

  return (
    <ScrollView style={tw`flex-1 bg-[#1a1f2e]`} contentContainerStyle={tw`p-4`}>
      <Text style={tw`text-white text-3xl font-bold mb-6 text-center`}>Daily Practice</Text>
      
      {error && <Text style={tw`text-red-500 text-center mb-4`}>{error}</Text>}

      {isLoading && (
        <View style={tw`flex-1 justify-center items-center p-6 bg-gray-800 rounded-lg shadow-md my-4 min-h-[200px]`}>
          <Text style={tw`text-gray-400`}>Loading content...</Text>
        </View>
      )}

      <DailyStory story={dailyStory} />
      <ShadowingPractice segments={shadowingSegments} />
      <SpeakingPrompts prompts={speakingPrompts} />
    </ScrollView>
  );
}