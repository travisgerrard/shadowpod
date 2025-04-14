import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import tw from 'twrnc';
import DailyStory from '../../components/DailyStory';
import ShadowingPractice from '../../components/ShadowingPractice';
import SpeakingPrompts from '../../components/SpeakingPrompts'; // Import SpeakingPrompts
import { StoryContent, ShadowingSegment, SpeakingPrompt, GeneratedContent } from 'shadowpod-shared/lib/types'; // Import types
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const [dailyStory, setDailyStory] = useState<StoryContent | null>(null);
  const [shadowingSegments, setShadowingSegments] = useState<ShadowingSegment[] | null>(null);
  const [speakingPrompts, setSpeakingPrompts] = useState<SpeakingPrompt[] | null>(null); // Add state for prompts
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStory = async () => {
      setIsLoading(true);
      setError(null);
      setDailyStory(null);
      setShadowingSegments(null);
      setSpeakingPrompts(null); // Clear previous prompts

      try {
        // Placeholder parameters - replace with actual user data later
        const params = {
          vocab: ['猫', '犬', '食べる', '飲む', '大きい', '小さい'], // Example vocab
          grammar: ['NはNです', 'NがAdjです'], // Example grammar points
          wanikaniLevel: '5' // Example level
        };

        console.log('Invoking generate-content function with params:', params);

        // Ensure we have an authenticated client
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Not authenticated");
          // The layout should prevent this, but good to check
        }

        const { data, error: functionError } = await supabase.functions.invoke<GeneratedContent>('generate-content', {
          body: params,
        });

        if (functionError) {
          console.error('Edge function returned error:', functionError);
          // Attempt to parse Supabase function error details
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
        setSpeakingPrompts(data.speakingPrompts); // Store speaking prompts

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

      {/* Render DailyStory component */}
      {/* Render DailyStory component */}
      <DailyStory story={dailyStory} />

      {/* Render ShadowingPractice component */}
      <ShadowingPractice segments={shadowingSegments} />

      {/* Render SpeakingPrompts component */}
      <SpeakingPrompts prompts={speakingPrompts} />

    </ScrollView>
  );
}