import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import tw from 'twrnc';

export default function PastLessonsScreen() {
  return (
    <View style={[tw`flex-1 justify-center items-center bg-[#1a1f2e] p-4`]}>
      <Text style={tw`text-white text-2xl font-bold mb-4`}>Past Lessons</Text>
      <Text style={tw`text-gray-400 text-center`}>
        This screen will display the user's history of completed lessons or practices.
      </Text>
    </View>
  );
}