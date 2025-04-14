import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { ShadowingSegment } from 'shadowpod-shared/lib/types';
import { supabase } from '../../lib/supabase';
import ShadowingPractice from '../../components/ShadowingPractice';

export default function ShadowingScreen() {
  const [shadowingSegments, setShadowingSegments] = useState<ShadowingSegment[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const { data, error: queryError } = await supabase
          .from('user_modules')
          .select('content')
          .eq('user_id', session.user.id)
          .eq('module_type', 'shadowing')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (queryError) throw queryError;

        if (!data || !data.content?.segments || data.content.segments.length === 0) {
          throw new Error('No shadowing segments available');
        }

        setShadowingSegments(data.content.segments);
      } catch (err: any) {
        console.error("[ShadowingScreen] Error fetching content:", err);
        setError(err.message || "Failed to load shadowing segments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <ScrollView style={tw`flex-1 bg-[#1a1f2e]`} contentContainerStyle={tw`p-4 pt-12`}>
      <Text style={tw`text-white text-3xl font-bold mb-6 text-center`}>Shadowing Practice</Text>

      {error && (
        <View style={tw`p-4 bg-red-900 bg-opacity-50 rounded-lg mb-4`}>
          <Text style={tw`text-red-300 text-center`}>{error}</Text>
        </View>
      )}

      {isLoading && (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={tw`text-gray-400 mt-4`}>Loading shadowing segments...</Text>
        </View>
      )}

      <ShadowingPractice segments={shadowingSegments} />
    </ScrollView>
  );
}