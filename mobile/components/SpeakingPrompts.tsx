import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import tw from 'twrnc';
import { SpeakingPrompt } from 'shadowpod-shared/lib/types'; // Import shared type
import { Ionicons } from '@expo/vector-icons';

interface SpeakingPromptsProps {
  prompts: SpeakingPrompt[] | null; // Allow null for loading/error state
}

export default function SpeakingPrompts({ prompts }: SpeakingPromptsProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  if (!prompts || prompts.length === 0) {
    return (
      <View style={tw`mt-4 p-4 bg-gray-800 rounded-lg items-center justify-center min-h-[200px]`}>
        <Text style={tw`text-gray-400`}>Loading speaking prompts...</Text>
      </View>
    );
  }

  const currentPrompt = prompts[currentPromptIndex];

  // Basic validation for the current prompt structure
  if (!currentPrompt?.question?.japanese || !currentPrompt?.question?.english ||
      !currentPrompt?.modelAnswer?.japanese || !currentPrompt?.modelAnswer?.english) {
    return (
      <View style={tw`mt-4 p-4 bg-red-900 bg-opacity-50 rounded-lg`}>
        <Text style={tw`text-red-300 font-semibold mb-2`}>Error: Invalid Prompt Format</Text>
        <Text style={tw`text-red-300`}>The current prompt data is incomplete.</Text>
      </View>
    );
  }


  const handleNextPrompt = () => {
    if (currentPromptIndex < prompts.length - 1) {
      setCurrentPromptIndex(currentPromptIndex + 1);
      setShowAnswer(false); // Hide answer when changing prompt
      setShowTranslation(false); // Optionally hide translation too
    }
  };

  const handlePreviousPrompt = () => {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(currentPromptIndex - 1);
      setShowAnswer(false); // Hide answer when changing prompt
      setShowTranslation(false); // Optionally hide translation too
    }
  };

  return (
    <View style={tw`mt-4 p-4 bg-gray-800 rounded-lg`}>
      {/* Header */}
      <View style={tw`flex-row justify-between items-center mb-6`}> {/* Increased bottom margin */}
        <Text style={tw`text-white text-xl font-semibold`}>
          Speaking Prompt ({currentPromptIndex + 1}/{prompts.length})
        </Text>
        <TouchableOpacity
          onPress={() => setShowTranslation(!showTranslation)}
          style={tw`px-2 py-1 border border-gray-500 rounded`}
        >
          <Text style={tw`text-xs text-gray-300`}>
            {showTranslation ? 'Hide' : 'Show'} Translation
          </Text>
        </TouchableOpacity>
      </View>

      {/* Question - Use my-4 for consistent vertical margin */}
      <View style={tw`my-4 p-4 bg-gray-700 rounded-md`}>
        <Text style={tw`text-sm font-semibold text-gray-300 mb-2`}>Question:</Text>
        <Text style={tw`text-lg text-white leading-relaxed`}>{currentPrompt.question.japanese}</Text>
        {showTranslation && (
          <Text style={tw`mt-2 text-gray-300 leading-relaxed border-t border-gray-600 pt-2`}>
            {currentPrompt.question.english}
          </Text>
        )}
      </View>

      {/* Answer Section - Add vertical margin */}
      {!showAnswer ? (
        <TouchableOpacity
          onPress={() => setShowAnswer(true)}
          style={tw`w-full py-2.5 my-4 bg-indigo-600 rounded-md items-center`} // Changed mb-4 to my-4
        >
          <Text style={tw`text-white font-medium`}>Show Model Answer</Text>
        </TouchableOpacity>
      ) : (
        <View style={tw`my-4 p-4 bg-indigo-900 bg-opacity-50 rounded-md`}> {/* Changed mb-4 to my-4 */}
          <Text style={tw`text-sm font-semibold text-indigo-200 mb-2`}>Model Answer:</Text>
          <Text style={tw`text-lg text-white leading-relaxed`}>{currentPrompt.modelAnswer.japanese}</Text>
          {showTranslation && (
            <Text style={tw`mt-2 text-indigo-200 leading-relaxed border-t border-indigo-700 pt-2`}>
              {currentPrompt.modelAnswer.english}
            </Text>
          )}
        </View>
      )}

      {/* Navigation - Use my-4 for consistent vertical margin */}
      <View style={tw`flex-row justify-between items-center my-4`}>
        <TouchableOpacity
          onPress={handlePreviousPrompt}
          disabled={currentPromptIndex === 0}
          style={tw`flex-row items-center px-4 py-2 rounded-md bg-gray-600 ${currentPromptIndex === 0 ? 'opacity-50' : ''}`}
        >
           <Ionicons name="arrow-back-outline" size={20} color="white" style={tw`mr-2`} />
          <Text style={tw`text-white font-medium`}>Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNextPrompt}
          disabled={currentPromptIndex === prompts.length - 1}
          style={tw`flex-row items-center px-4 py-2 rounded-md bg-gray-600 ${currentPromptIndex === prompts.length - 1 ? 'opacity-50' : ''}`}
        >
          <Text style={tw`text-white font-medium`}>Next</Text>
          <Ionicons name="arrow-forward-outline" size={20} color="white" style={tw`ml-2`} />
        </TouchableOpacity>
      </View>
    </View>
  );
}