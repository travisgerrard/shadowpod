import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import SpeakingPrompts from '../../components/SpeakingPrompts';
import { SpeakingPrompt, GeneratedContent } from 'shadowpod-shared/lib/types';
import { supabase } from '../../lib/supabase';

export default function PromptsScreen() {
  const [speakingPrompts, setSpeakingPrompts] = useState<SpeakingPrompt[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      setError(null);
      setSpeakingPrompts(null);

      try {
        // Placeholder parameters - replace with actual user data later
        const params = {
          vocab: ['猫', '犬', '食べる', '飲む', '大きい', '小さい'],
          grammar: ['NはNです', 'NがAdjです'],
          wanikaniLevel: '5'
        };

        console.log('[PromptsScreen] Invoking generate-content function');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const { data, error: functionError } = await supabase.functions.invoke<GeneratedContent>('generate-content', {
          body: params,
        });

        if (functionError) {
          console.error('[PromptsScreen] Edge function error:', functionError);
          let errMsg = `Failed to generate content.`;
           if (functionError.context && typeof functionError.context === 'object' && 'message' in functionError.context) {
             errMsg += ` Error: ${functionError.context.message}`;
          } else if (functionError.message) {
             errMsg += ` Error: ${functionError.message}`;
          }
          throw new Error(errMsg);
        }

        if (!data || !data.speakingPrompts || data.speakingPrompts.length === 0) {
          console.error('[PromptsScreen] No speaking prompts returned:', data);
          throw new Error('No speaking prompts generated.');
        }

        console.log('[PromptsScreen] Successfully received speaking prompts:', data.speakingPrompts.length);
        setSpeakingPrompts(data.speakingPrompts);

      } catch (err: any) {
        console.error("[PromptsScreen] Error fetching content:", err);
        setError(err.message || "Failed to load speaking prompts.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    // Add pt-12 to contentContainerStyle for top padding
    <ScrollView style={tw`flex-1 bg-[#1a1f2e]`} contentContainerStyle={tw`p-4 pt-12`}>
      <Text style={tw`text-white text-3xl font-bold mb-6 text-center`}>Speaking Prompts</Text>

      {error && <Text style={tw`text-red-500 text-center mb-4`}>{error}</Text>}

      {isLoading && !speakingPrompts && (
         <View style={tw`flex-1 justify-center items-center p-6 bg-gray-800 rounded-lg shadow-md my-4 min-h-[200px]`}>
           <ActivityIndicator size="large" color="#ffffff" />
           <Text style={tw`text-gray-400 mt-4`}>Generating speaking prompts...</Text>
         </View>
      )}

      {/* Render SpeakingPrompts component */}
      {/* Note: SpeakingPrompts handles its own internal loading/empty state if prompts is null initially */}
      <SpeakingPrompts prompts={speakingPrompts} />

    </ScrollView>
  );
}