import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import tw from 'twrnc';
import { supabase } from '../../lib/supabase';
import { UserModule, StoryContent, ShadowingSegment, SpeakingPrompt } from 'shadowpod-shared/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import DailyStory from '../../components/DailyStory';
import ShadowingPractice from '../../components/ShadowingPractice';
import SpeakingPrompts from '../../components/SpeakingPrompts';

// Helper function to get a title/summary from module content
const getModuleTitle = (module: UserModule): string => {
  try {
    if (module.module_type === 'story' && module.content) {
      return (module.content as StoryContent).title?.japanese || 'Untitled Story';
    }
  } catch (e) {
    console.error("Error getting module title:", e);
  }
  return 'Unknown Story';
};

export default function HistoryScreen() {
  const [stories, setStories] = useState<UserModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('story');
  const [currentContent, setCurrentContent] = useState<{
    story?: StoryContent;
    shadowingSegments?: ShadowingSegment[];
    speakingPrompts?: SpeakingPrompt[];
  } | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      setError(null);
      setStories([]);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");
        const userId = session.user.id;

        const { data, error: queryError } = await supabase
          .from('user_modules')
          .select('*')
          .eq('user_id', userId)
          .eq('module_type', 'story')
          .order('created_at', { ascending: false });

        if (queryError) {
          console.error('[HistoryScreen] Query error:', queryError);
          throw new Error(queryError.message || 'Failed to fetch stories.');
        }

        if (!data) {
          setStories([]);
        } else {
          setStories(Array.isArray(data) ? data : []);
          if (data.length > 0) {
            setSelectedStoryId(data[0].id);
          }
        }
      } catch (err: any) {
        console.error("[HistoryScreen] Error fetching stories:", err);
        setError(err.message || "Failed to load stories.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();
  }, []);

  // Load associated content when a story is selected
  useEffect(() => {
    const loadAssociatedContent = async () => {
      if (!selectedStoryId) return;

      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get the selected story
        const { data: storyData } = await supabase
          .from('user_modules')
          .select('content')
          .eq('id', selectedStoryId)
          .single();

        if (!storyData) return;

        // Get associated shadowing content
        const { data: shadowingData } = await supabase
          .from('user_modules')
          .select('content')
          .eq('user_id', session.user.id)
          .eq('module_type', 'shadowing')
          .eq('content->>storyId', selectedStoryId)
          .single();

        // Get associated prompts
        const { data: promptsData } = await supabase
          .from('user_modules')
          .select('content')
          .eq('user_id', session.user.id)
          .eq('module_type', 'prompt')
          .eq('content->>storyId', selectedStoryId)
          .single();

        setCurrentContent({
          story: storyData.content as StoryContent,
          shadowingSegments: shadowingData?.content?.segments || [],
          speakingPrompts: promptsData?.content?.prompts || []
        });
      } catch (err) {
        console.error("Error loading associated content:", err);
        setError("Failed to load associated content");
      } finally {
        setIsLoading(false);
      }
    };

    loadAssociatedContent();
  }, [selectedStoryId]);

  const renderTabContent = () => {
    if (!currentContent) {
      return (
        <View style={tw`p-4 items-center`}>
          <Text style={tw`text-gray-400`}>No content selected</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'story':
        return currentContent.story ? (
          <DailyStory story={currentContent.story} />
        ) : (
          <View style={tw`p-4 items-center`}>
            <Text style={tw`text-gray-400`}>Story content not available</Text>
          </View>
        );
      case 'shadowing':
        return currentContent.shadowingSegments && currentContent.shadowingSegments.length > 0 ? (
          <ShadowingPractice segments={currentContent.shadowingSegments} />
        ) : (
          <View style={tw`p-4 items-center`}>
            <Text style={tw`text-gray-400`}>Shadowing content not available</Text>
          </View>
        );
      case 'speaking':
        return currentContent.speakingPrompts && currentContent.speakingPrompts.length > 0 ? (
          <SpeakingPrompts prompts={currentContent.speakingPrompts} />
        ) : (
          <View style={tw`p-4 items-center`}>
            <Text style={tw`text-gray-400`}>Speaking prompts not available</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderStoryItem = ({ item }: { item: UserModule }) => (
    <TouchableOpacity
      style={tw`bg-gray-800 p-4 rounded-lg mb-3 border border-gray-700`}
      onPress={() => setSelectedStoryId(item.id)}
    >
      <View style={tw`flex-row justify-between items-center mb-1`}>
        <Text style={tw`text-white font-semibold text-base capitalize flex-1 mr-2`} numberOfLines={1}>
          {getModuleTitle(item)}
        </Text>
        <Text style={tw`text-gray-400 text-xs`}>
          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (selectedStoryId && currentContent) {
    return (
      <View style={tw`flex-1 bg-[#1a1f2e]`}>
        <View style={tw`p-4 pt-12`}>
          <TouchableOpacity
            style={tw`flex-row items-center mb-4`}
            onPress={() => setSelectedStoryId(null)}
          >
            <Ionicons name="arrow-back" size={24} color="white" style={tw`mr-2`} />
            <Text style={tw`text-white text-lg`}>Back to Stories</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`flex-row border-b border-gray-700 mb-4`}>
          <TouchableOpacity
            style={tw`flex-1 py-2 items-center ${
              activeTab === 'story' ? 'border-b-2 border-indigo-500' : ''
            }`}
            onPress={() => setActiveTab('story')}
          >
            <Text style={tw`text-white font-medium`}>Story</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-1 py-2 items-center ${
              activeTab === 'shadowing' ? 'border-b-2 border-indigo-500' : ''
            }`}
            onPress={() => setActiveTab('shadowing')}
          >
            <Text style={tw`text-white font-medium`}>Shadowing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`flex-1 py-2 items-center ${
              activeTab === 'speaking' ? 'border-b-2 border-indigo-500' : ''
            }`}
            onPress={() => setActiveTab('speaking')}
          >
            <Text style={tw`text-white font-medium`}>Speaking</Text>
          </TouchableOpacity>
        </View>

        {renderTabContent()}
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[#1a1f2e]`}>
      <View style={tw`p-4 pt-12`}>
        <Text style={tw`text-white text-3xl font-bold mb-6 text-center`}>Past Stories</Text>
      </View>

      {isLoading && (
        <View style={tw`flex-1 justify-center items-center`}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={tw`text-gray-400 mt-2`}>Loading Stories...</Text>
        </View>
      )}

      {error && !isLoading && (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <Ionicons name="alert-circle-outline" size={40} color="rgb(239 68 68)" />
          <Text style={tw`text-red-500 text-center mt-2`}>{error}</Text>
        </View>
      )}

      {!isLoading && !error && stories.length === 0 && (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <Ionicons name="archive-outline" size={40} color="#888888" />
          <Text style={tw`text-gray-400 text-center mt-2`}>
            No past stories found. Complete some practice activities!
          </Text>
        </View>
      )}

      {!isLoading && !error && stories.length > 0 && (
        <FlatList
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={tw`px-4 pb-4`}
        />
      )}
    </View>
  );
}