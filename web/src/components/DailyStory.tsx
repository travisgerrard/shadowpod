'use client';

import { useState, useEffect, useRef } from 'react';
import { StoryContent } from '../../../shared/lib/types';
import React from 'react';
import { useSpeechVoices } from '../hooks/useSpeechVoices';

interface DailyStoryProps {
  story: StoryContent;
}

// Split text into sentences for sentence-by-sentence playback
const splitIntoSentences = (text: string): string[] => {
  // Japanese sentence endings: 。, ！, ？
  return text
    .replace(/([。！？])/g, '$1|') // Add a marker at sentence endings
    .split('|')                   // Split by marker
    .filter(s => s.trim().length > 0); // Remove empty strings
};

export default function DailyStory({ story }: DailyStoryProps) {
  const {
    japaneseVoices,
    selectedVoice,
    isAvailable: speechSynthesisIsAvailable,
    error: speechError,
    setError: setSpeechError,
    handleVoiceChange,
    isEnhancedVoice
  } = useSpeechVoices();

  const [showTranslation, setShowTranslation] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.9);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);
  
  // Store sentences for playback
  const japSentencesRef = useRef<string[]>([]);
  // Keep a reference to the current utterance
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Store the queue status
  const isProcessingRef = useRef(false);
  // Store the play state in a ref to prevent state loss
  const isPlayingRef = useRef(false);
  
  // Pre-process the story text when it's available
  useEffect(() => {
    if (story && story.japanese) {
      japSentencesRef.current = splitIntoSentences(story.japanese);
    }
  }, [story]);

  // Basic validation for story data
  if (!story || !story.title || !story.title.japanese || !story.title.english || !story.japanese || !story.english) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-red-500">
            Error: Invalid story format
          </h2>
        </div>
        <div className="mb-4">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            The story data appears to be missing or invalid. Please try generating new content.
          </p>
          <pre className="mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
            {JSON.stringify(story, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // Process sentences in queue
  const processSpeechQueue = async (startIndex = 0) => {
    // If we've reached the end, exit
    if (startIndex >= japSentencesRef.current.length) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setIsPaused(false);
      setActiveSentenceIndex(-1);
      isProcessingRef.current = false;
      console.log("Reached end of story, stopping playback");
      return;
    }

    // If not playing anymore, exit
    if (!isPlayingRef.current || isPaused) {
      console.log("Not playing or paused, stopping queue processing");
      return;
    }

    // Cancel any existing speech synthesis
    window.speechSynthesis.cancel();
    
    // Start at the requested sentence
    console.log(`Moving to sentence ${startIndex + 1}`);
    setActiveSentenceIndex(startIndex);
    isProcessingRef.current = true;
    
    try {
      const sentence = japSentencesRef.current[startIndex];
      console.log(`Speaking sentence ${startIndex + 1}: ${sentence}`);
      
      // Create utterance for this sentence
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = 'ja-JP';
      utterance.rate = playbackRate;
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Store reference to current utterance
      currentUtteranceRef.current = utterance;
      
      // Set up a definite event for when this sentence should complete
      const durationPerChar = 300; // ms per character
      const minDuration = 2000; // minimum 2 seconds
      const estimatedDuration = Math.max(minDuration, sentence.length * durationPerChar / playbackRate);
      
      // Track if we've already advanced to the next sentence
      let hasAdvanced = false;
      
      await new Promise<void>((resolve) => {
        // Set up backup timer
        const timer = setTimeout(() => {
          console.log(`Timer completed for sentence ${startIndex + 1}`);
          if (!hasAdvanced) {
            hasAdvanced = true;
            resolve();
          }
        }, estimatedDuration);
        
        // Also listen for the onend event
        utterance.onend = () => {
          console.log(`onend fired for sentence ${startIndex + 1}`);
          clearTimeout(timer);
          if (!hasAdvanced) {
            hasAdvanced = true;
            resolve();
          }
        };
        
        // Handle speech errors
        utterance.onerror = (event) => {
          console.error(`Speech error for sentence ${startIndex + 1}:`, event);
          clearTimeout(timer);
          setSpeechError(`Error with sentence ${startIndex + 1}: ${event.error}`);
          if (!hasAdvanced) {
            hasAdvanced = true;
            resolve();
          }
        };
        
        // Start speaking
        window.speechSynthesis.speak(utterance);
      });
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Move to next sentence if still playing
      if (isPlayingRef.current && !isPaused) {
        console.log(`Moving to next sentence ${startIndex + 2}`);
        isProcessingRef.current = false;
        await processSpeechQueue(startIndex + 1);
      } else {
        console.log(`Playback stopped - isPlaying: ${isPlayingRef.current}, isPaused: ${isPaused}`);
        isProcessingRef.current = false;
      }
      
    } catch (error) {
      console.error('Error in speech processing:', error);
      setSpeechError(`Processing error: ${error instanceof Error ? error.message : String(error)}`);
      isProcessingRef.current = false;
    }
  };

  // Handle play/pause/stop
  const handlePlayAudio = async () => {
    setSpeechError(null);
    
    if (!speechSynthesisIsAvailable) {
      setSpeechError('Speech synthesis is not supported in this browser');
      return;
    }
    
    // If already playing, stop playback
    if (isPlaying && !isPaused) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      isPlayingRef.current = false;
      setIsPaused(false);
      setActiveSentenceIndex(-1);
      isProcessingRef.current = false;
      return;
    }
    
    // If paused, resume
    if (isPlaying && isPaused) {
      setIsPaused(false);
      // Continue from current sentence
      processSpeechQueue(activeSentenceIndex);
      return;
    }
    
    // Start new playback
    setIsPlaying(true);
    isPlayingRef.current = true;
    setIsPaused(false);
    processSpeechQueue(0);
  };
  
  // Handle pause
  const handlePauseAudio = () => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };
  
  // Handle speed change
  const handleSpeedChange = (newRate: number) => {
    setPlaybackRate(newRate);
    
    // Update current utterance if it exists
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current.rate = newRate;
      
      // If currently speaking, need to restart with new rate
      if (isPlaying && !isPaused) {
        const currentIndex = activeSentenceIndex;
        window.speechSynthesis.cancel();
        processSpeechQueue(currentIndex);
      }
    }
  };

  // Render Japanese text with sentence highlighting
  const renderJapaneseText = () => {
    if (activeSentenceIndex === -1 || !isPlaying) {
      // Not playing, render normal text
      return <p className="text-lg text-gray-800 dark:text-white leading-relaxed">{story.japanese}</p>;
    }
    
    // Playing, highlight the active sentence
    return (
      <div className="text-lg text-gray-800 dark:text-white leading-relaxed">
        {japSentencesRef.current.map((sentence, idx) => {
          // Determine if we need a space after this sentence
          const needsSpace = idx < japSentencesRef.current.length - 1 && 
            !sentence.endsWith('。') && !sentence.endsWith('、') && 
            !sentence.endsWith('！') && !sentence.endsWith('？') &&
            !japSentencesRef.current[idx + 1].startsWith('。') && 
            !japSentencesRef.current[idx + 1].startsWith('、') &&
            !japSentencesRef.current[idx + 1].startsWith('！') && 
            !japSentencesRef.current[idx + 1].startsWith('？');
            
          return (
            <React.Fragment key={idx}>
              <span 
                className={idx === activeSentenceIndex ? 
                  "bg-yellow-200 dark:bg-yellow-800 rounded px-1" : ""}
              >
                {sentence}
              </span>
              {needsSpace && ' '}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {story.title.japanese}
          {showTranslation && (
            <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
              ({story.title.english})
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {showTranslation ? 'Hide Translation' : 'Show Translation'}
        </button>
      </div>

      <div className="mb-6">
        {renderJapaneseText()}
        {showTranslation && (
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {story.english}
          </p>
        )}
      </div>

      <div className="flex flex-col space-y-4">
        {/* Audio playback controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePlayAudio}
            className={`flex items-center justify-center ${
              isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white px-4 py-2 rounded-md`}
            disabled={!speechSynthesisIsAvailable}
          >
            {isPlaying && !isPaused ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <rect x="6" y="4" width="3" height="12" rx="1" />
                  <rect x="11" y="4" width="3" height="12" rx="1" />
                </svg>
                Stop Audio
              </>
            ) : isPaused ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Resume
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Play Audio
              </>
            )}
          </button>
          
          {isPlaying && !isPaused && (
            <button
              onClick={handlePauseAudio}
              className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pause
            </button>
          )}
        </div>
        
        {/* Playback settings */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Speed control */}
          <div className="flex items-center">
            <label className="mr-2 text-sm text-gray-700 dark:text-gray-300">Speed:</label>
            <select
              value={playbackRate}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value="0.7">Slow (0.7x)</option>
              <option value="0.9">Normal (0.9x)</option>
              <option value="1.0">Default (1.0x)</option>
              <option value="1.2">Fast (1.2x)</option>
            </select>
          </div>
          
          {/* Voice selection */}
          {japaneseVoices.length > 0 && (
            <div className="flex items-center">
              <label className="mr-2 text-sm text-gray-700 dark:text-gray-300">Voice:</label>
              <select
                value={selectedVoice?.name || ''}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm"
              >
                {japaneseVoices.map((voice, index) => (
                  <option key={`${voice.name}-${index}`} value={voice.name}>
                    {voice.name} ({voice.lang}) {isEnhancedVoice(voice) ? ' (Enhanced)' : voice.localService ? ' (System)' : ' (Web)'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {speechError && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300">{speechError}</p>
          </div>
        )}
      </div>
    </div>
  );
} 