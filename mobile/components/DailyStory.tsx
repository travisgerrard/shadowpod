import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import * as Speech from 'expo-speech';
import { Picker } from '@react-native-picker/picker';
import tw from 'twrnc';
import { StoryContent } from 'shadowpod-shared/lib/types';
import { Ionicons } from '@expo/vector-icons';

interface DailyStoryProps {
  story: StoryContent | null; // Allow null for loading state
}

// Split text into sentences (same as web)
const splitIntoSentences = (text: string): string[] => {
  return text
    .replace(/([。！？])/g, '$1|')
    .split('|')
    .filter(s => s.trim().length > 0);
};

export default function DailyStory({ story }: DailyStoryProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.9);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
  const [selectedVoiceIdentifier, setSelectedVoiceIdentifier] = useState<string | undefined>(undefined);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);

  const japSentencesRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false); // To prevent race conditions in onDone
  const isMountedRef = useRef(true); // To prevent state updates on unmounted component

  // Fetch available voices on mount
  useEffect(() => {
    isMountedRef.current = true;
    const fetchVoices = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        const japaneseVoices = voices.filter(v => v.language.startsWith('ja'));
        if (isMountedRef.current) {
          setAvailableVoices(japaneseVoices);
          // Select a default voice if available
          if (japaneseVoices.length > 0) {
            // Prioritize non-local, then local, then any
            const defaultVoice = 
              japaneseVoices.find(v => !v.identifier.includes('com.apple.speech.synthesis.voice')) || // Try non-Apple first
              japaneseVoices.find(v => v.quality === Speech.VoiceQuality.Enhanced) || // Try enhanced
              japaneseVoices[0]; // Fallback to first available
            setSelectedVoiceIdentifier(defaultVoice.identifier);
          }
          setIsLoadingVoices(false);
        }
      } catch (error) {
        console.error("Failed to get speech voices:", error);
        if (isMountedRef.current) {
          setSpeechError("Could not load speech voices.");
          setIsLoadingVoices(false);
        }
      }
    };
    fetchVoices();

    return () => {
      isMountedRef.current = false;
      Speech.stop(); // Stop any speech when component unmounts
    };
  }, []);

  // Process story text when available
  useEffect(() => {
    if (story?.japanese) {
      japSentencesRef.current = splitIntoSentences(story.japanese);
      setActiveSentenceIndex(-1); // Reset index when story changes
      setIsPlaying(false);
      setIsPaused(false);
      Speech.stop();
    }
  }, [story]);

  // Define processSpeechQueue using useCallback
  const processSpeechQueue = useCallback(async (startIndex = 0) => {
    console.log(`[processSpeechQueue] Start. Index: ${startIndex}, isProcessing: ${isProcessingRef.current}`);
    
    // Check mount status and processing flag first
    if (!isMountedRef.current || isProcessingRef.current) {
      console.log(`[processSpeechQueue] Stopping early (Mount/Processing). isMounted=${isMountedRef.current}, isProcessing=${isProcessingRef.current}`);
      // If stopped due to processing flag, maybe retry? (Optional, can cause loops if not careful)
      // if (isProcessingRef.current && isMountedRef.current) {
      //   setTimeout(() => processSpeechQueue(startIndex), 100);
      // }
      isProcessingRef.current = false; // Ensure reset if stopped here
      return;
    }

    // Check play/pause state *after* mount/processing checks
    // Read state directly inside useCallback as it has access to current closure values
    if (!isPlaying || isPaused) {
       console.log(`[processSpeechQueue] Stopping early (Play/Pause). isPlaying=${isPlaying}, isPaused=${isPaused}`);
       isProcessingRef.current = false; // Ensure reset
       return;
    }
  
    if (startIndex >= japSentencesRef.current.length) {
      console.log("[processSpeechQueue] Reached end of story.");
      if (isMountedRef.current) {
        setIsPlaying(false);
        setIsPaused(false);
        setActiveSentenceIndex(-1);
      }
      isProcessingRef.current = false;
      return;
    }
  
    isProcessingRef.current = true; // Set flag: we are now processing this sentence
    if (isMountedRef.current) {
      setActiveSentenceIndex(startIndex); // Update UI immediately
    }
  
    const sentence = japSentencesRef.current[startIndex];
    console.log(`[processSpeechQueue] Speaking sentence ${startIndex + 1}: "${sentence}"`);
    console.log(`[processSpeechQueue] Params: rate=${playbackRate}, voice=${selectedVoiceIdentifier}`);
  
    Speech.speak(sentence, {
      language: 'ja-JP',
      pitch: 1.0,
      rate: playbackRate,
      voice: selectedVoiceIdentifier,
      onDone: () => {
        console.log(`[processSpeechQueue] onDone fired for sentence ${startIndex + 1}.`);
        isProcessingRef.current = false; // Reset flag: finished processing this sentence
        // Check state *after* resetting flag
        if (isMountedRef.current && isPlaying && !isPaused) {
           console.log(`[processSpeechQueue] onDone -> Calling next sentence ${startIndex + 2}`);
           processSpeechQueue(startIndex + 1); // Recurse for next sentence
        } else {
           console.log(`[processSpeechQueue] onDone -> Not proceeding. isPlaying=${isPlaying}, isPaused=${isPaused}`);
           // If stopped on the last sentence, ensure state is fully reset
           if (isMountedRef.current && startIndex + 1 >= japSentencesRef.current.length) {
             setIsPlaying(false);
             setIsPaused(false);
             setActiveSentenceIndex(-1);
           }
        }
      },
      onError: (error) => {
        console.error(`[processSpeechQueue] onError fired for sentence ${startIndex + 1}:`, error);
        isProcessingRef.current = false; // Reset flag on error
        if (isMountedRef.current) {
          setSpeechError(`Speech error: ${error.message}`);
          // Stop playback fully on error
          setIsPlaying(false);
          setIsPaused(false);
          setActiveSentenceIndex(-1);
        }
      },
    });
  }, [isPlaying, isPaused, playbackRate, selectedVoiceIdentifier]); // Keep dependencies

  // Effect to handle starting the speech queue when isPlaying becomes true
  useEffect(() => {
    if (isPlaying && !isPaused) {
      // Check if we need to start from the beginning or resume
      const startIndex = activeSentenceIndex >= 0 ? activeSentenceIndex : 0;
      console.log(`[useEffect trigger] isPlaying=true, isPaused=false. Starting queue from index ${startIndex}`);
      isProcessingRef.current = false; // Ensure processing flag is reset before starting
      processSpeechQueue(startIndex);
    } else if (!isPlaying) {
       // If isPlaying becomes false (e.g., stopped manually), ensure speech stops
       console.log('[useEffect trigger] isPlaying=false. Stopping speech.');
       Speech.stop();
       isProcessingRef.current = false; // Reset processing flag
    }
  }, [isPlaying, isPaused]); // Depend only on isPlaying and isPaused

  const handlePlayAudio = () => {
    console.log(`[handlePlayAudio] Called. isPlaying: ${isPlaying}, isPaused: ${isPaused}`);
    setSpeechError(null);
    if (!story) return;

    if (isPlaying && !isPaused) { // --- Stop Case ---
      console.log('[handlePlayAudio] Action: Stop');
      // Setting isPlaying to false will trigger the useEffect cleanup
      setIsPlaying(false);
      setIsPaused(false); // Ensure paused is false
      setActiveSentenceIndex(-1); // Reset highlight
      // isProcessingRef will be reset by the useEffect or onDone/onError
    } else if (isPlaying && isPaused) { // --- Resume Case ---
      console.log('[handlePlayAudio] Action: Resume');
      // Setting isPaused to false will trigger the useEffect to start the queue
      setIsPaused(false);
    } else { // --- Start Case ---
      console.log('[handlePlayAudio] Action: Start');
      setActiveSentenceIndex(-1); // Ensure we start from the beginning visually
      // Setting isPlaying to true will trigger the useEffect to start the queue
      setIsPlaying(true);
      setIsPaused(false); // Ensure paused is false
    }
  };

  const handlePauseAudio = () => {
    if (isPlaying && !isPaused) {
      Speech.pause(); // Note: Expo Speech pause might be unreliable, stopping might be better
      // Speech.stop(); // Alternative: just stop instead of pausing
      setIsPaused(true);
      // setActiveSentenceIndex remains where it was
    }
  };

  const handleSpeedChange = (newRate: number) => {
    setPlaybackRate(newRate);
    // If playing, stop and restart with new rate (Expo Speech doesn't update rate mid-speech)
    if (isPlaying && !isPaused) {
      const currentIndex = activeSentenceIndex;
      Speech.stop();
      isProcessingRef.current = false; // Reset flag
      // Need a slight delay before restarting after stop
      setTimeout(() => {
         if (isMountedRef.current && isPlaying && !isPaused) { // Check state again
            processSpeechQueue(currentIndex);
         }
      }, 100);
    }
  };

  const handleVoiceChange = (newVoiceIdentifier: string) => {
    setSelectedVoiceIdentifier(newVoiceIdentifier);
     // If playing, stop and restart with new voice
    if (isPlaying && !isPaused) {
      const currentIndex = activeSentenceIndex;
      Speech.stop();
      isProcessingRef.current = false; // Reset flag
      setTimeout(() => {
         if (isMountedRef.current && isPlaying && !isPaused) { // Check state again
            processSpeechQueue(currentIndex);
         }
      }, 100);
    }
  };

  // Render Japanese text with highlighting
  const renderJapaneseText = () => {
    if (!story?.japanese) return null;

    if (activeSentenceIndex === -1 || !isPlaying) {
      return <Text style={tw`text-lg text-white leading-relaxed`}>{story.japanese}</Text>;
    }

    return (
      <Text style={tw`text-lg text-white leading-relaxed`}>
        {japSentencesRef.current.map((sentence, idx) => (
          <Text
            key={idx}
            style={idx === activeSentenceIndex ? tw`bg-yellow-400 bg-opacity-50 rounded` : {}}
          >
            {sentence}
          </Text>
        ))}
      </Text>
    );
  };

  if (!story) {
    return (
      <View style={tw`flex-1 justify-center items-center p-6 bg-gray-800 rounded-lg shadow-md my-4`}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={tw`text-gray-400 mt-4`}>Loading story...</Text>
      </View>
    );
  }

  // Basic validation (similar to web)
  if (!story.title?.japanese || !story.title?.english || !story.japanese || !story.english) {
    return (
      <View style={tw`bg-gray-800 rounded-lg shadow-md p-6 my-4`}>
        <Text style={tw`text-xl font-bold text-red-500 mb-4`}>Error: Invalid story format</Text>
        <Text style={tw`text-lg text-gray-400`}>
          The story data appears to be missing or invalid.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={tw`bg-gray-800 rounded-lg shadow-md p-6 my-4`}>
      {/* Title */}
      <View style={tw`flex-row justify-between items-center mb-4`}>
        <Text style={tw`text-xl font-bold text-white flex-1 mr-2`}>
          {story.title.japanese}
          {showTranslation && (
            <Text style={tw`text-gray-400 text-sm`}> ({story.title.english})</Text>
          )}
        </Text>
        <TouchableOpacity
          onPress={() => setShowTranslation(!showTranslation)}
          style={tw`px-3 py-1 border border-gray-600 rounded-md`}
        >
          <Text style={tw`text-sm text-gray-300`}>
            {showTranslation ? 'Hide' : 'Show'} Translation
          </Text>
        </TouchableOpacity>
      </View>

      {/* Story Text */}
      <View style={tw`mb-6`}>
        {renderJapaneseText()}
        {showTranslation && (
          <Text style={tw`mt-3 text-gray-400 leading-relaxed`}>{story.english}</Text>
        )}
      </View>

      {/* Controls */}
      <View style={tw`mb-6`}>
        <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
          <TouchableOpacity
            onPress={handlePlayAudio}
            style={tw`flex-row items-center justify-center px-4 py-2 rounded-md ${
              isPlaying && !isPaused ? 'bg-red-600' : isPaused ? 'bg-yellow-500' : 'bg-indigo-600'
            }`}
            disabled={isLoadingVoices}
          >
            <Ionicons
              name={isPlaying && !isPaused ? "stop-outline" : isPaused ? "play-outline" : "play-outline"}
              size={20}
              color="white"
              style={tw`mr-2`}
            />
            <Text style={tw`text-white font-medium`}>
              {isPlaying && !isPaused ? 'Stop' : isPaused ? 'Resume' : 'Play'}
            </Text>
          </TouchableOpacity>

          {isPlaying && !isPaused && (
             <TouchableOpacity
               onPress={handlePauseAudio}
               style={tw`flex-row items-center justify-center bg-yellow-500 px-4 py-2 rounded-md`}
             >
               <Ionicons name="pause-outline" size={20} color="white" style={tw`mr-2`} />
               <Text style={tw`text-white font-medium`}>Pause</Text>
             </TouchableOpacity>
           )}
        </View>

        {/* Settings - Increased gap and consistent row height */}
        <View style={tw`flex-col gap-y-4`}>
           {/* Speed Picker Row */}
           <View style={tw`flex-row items-center h-10`}>
             <Text style={tw`text-sm text-gray-300 mr-2 w-12`}>Speed:</Text>
             {/* Picker Container */}
             <View style={tw`flex-1 bg-gray-700 rounded border border-gray-600 h-full justify-center`}>
               <Picker
                 selectedValue={playbackRate}
                 onValueChange={(itemValue) => handleSpeedChange(itemValue)}
                 style={tw`text-white`}
                 dropdownIconColor="white"
                 mode="dropdown"
               >
                 <Picker.Item label="Slow (0.7x)" value={0.7} />
                 <Picker.Item label="Normal (0.9x)" value={0.9} />
                 <Picker.Item label="Default (1.0x)" value={1.0} />
                 <Picker.Item label="Fast (1.2x)" value={1.2} />
               </Picker>
             </View>
           </View>

           {/* Voice Picker Row */}
           <View style={tw`flex-row items-center h-10`}>
             <Text style={tw`text-sm text-gray-300 mr-2 w-12`}>Voice:</Text>
              {/* Picker Container */}
             <View style={tw`flex-1 bg-gray-700 rounded border border-gray-600 h-full justify-center`}>
               {isLoadingVoices ? (
                 <ActivityIndicator color="#ffffff" />
               ) : availableVoices.length > 0 ? (
                 <Picker
                   selectedValue={selectedVoiceIdentifier}
                   onValueChange={(itemValue) => handleVoiceChange(itemValue)}
                   style={tw`text-white`}
                   dropdownIconColor="white"
                   mode="dropdown"
                 >
                   {availableVoices.map((voice) => (
                     <Picker.Item
                       key={voice.identifier}
                       label={`${voice.name} (${voice.quality === Speech.VoiceQuality.Enhanced ? 'Enhanced' : 'Standard'})`}
                       value={voice.identifier}
                     />
                   ))}
                 </Picker>
               ) : (
                 <Text style={tw`text-gray-400 px-2`}>No Japanese voices</Text>
               )}
             </View>
           </View>
        </View>

        {/* Error Message */}
        {speechError && (
          <View style={tw`mt-4 p-2 bg-red-900 bg-opacity-50 rounded-md`}>
            <Text style={tw`text-sm text-red-300`}>{speechError}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}