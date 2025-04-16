'use client';

import { useState, useEffect, useRef } from 'react';
import { useSpeechVoices } from '@/hooks/useSpeechVoices';

// Add type declarations for Web Speech API
type SpeechRecognitionConstructor = new () => SpeechRecognition;

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionResult {
  0: {
    transcript: string;
  };
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResult[];
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface Segment {
  japanese: string;
  english: string;
}

interface ShadowingPracticeProps {
  segments: Segment[];
}

export default function ShadowingPractice({ segments }: ShadowingPracticeProps) {
  // State for managing segments and playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [playbackRate, setPlaybackRate] = useState(0.5);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);

  // Ref to store recognition instance
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Cleanup function for recognition
  const cleanupRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_: unknown) {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setInterimTranscript('');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecognition();
    };
  }, []);

  // Get current segment
  const currentSegment = segments[currentSegmentIndex];

  // Speech synthesis and recognition setup
  const {
    selectedVoice,
    japaneseVoices,
    handleVoiceChange,
    isEnhancedVoice,
  } = useSpeechVoices();

  // Check for speech synthesis availability
  useEffect(() => {
    if (!window.speechSynthesis) {
      setError('Speech synthesis is not supported in this browser');
    }
  }, []);

  // Handle play audio
  const handlePlayAudio = () => {
    if (!currentSegment || !selectedVoice) return;

    const utterance = new SpeechSynthesisUtterance(currentSegment.japanese);
    utterance.voice = selectedVoice;
    utterance.lang = 'ja-JP';
    utterance.rate = playbackRate;
    
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
  };

  // Handle speed change
  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackRate(newSpeed);
  };

  // Handle start recording
  const handleStartRecording = async () => {
    try {
      // Clean up any existing recognition instance
      cleanupRecognition();

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition is not supported in this browser');
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = Array.from(event.results);
        const lastResult = results[results.length - 1];
        
        if (lastResult) {
          if (lastResult.isFinal) {
            setTranscript(lastResult[0].transcript);
            setInterimTranscript('');
          } else {
            setInterimTranscript(lastResult[0].transcript);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setError(`Speech recognition error: ${event.error}`);
        cleanupRecognition();
      };

      recognition.onend = () => {
        // Only clean up if we're not actively recording
        // This prevents cleanup when the recognition service auto-restarts
        if (isRecording) {
          // Restart recognition if we're still supposed to be recording
          handleStartRecording();
        } else {
          cleanupRecognition();
        }
      };

      // Store the recognition instance
      recognitionRef.current = recognition;

      recognition.start();
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      setIsRecording(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Speech recognition is not supported';
      setError(errorMessage);
      cleanupRecognition();
    }
  };

  // Handle stop recording
  const handleStopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_: unknown) {
        // Ignore errors when stopping
      }
    }
    setIsRecording(false);
    handleCompare(); // Calculate accuracy when recording stops
  };

  // Handle comparison between transcript and current segment
  const handleCompare = () => {
    if (!transcript || !currentSegment) return;
    
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .trim()
        // Keep basic punctuation but normalize it
        .replace(/[、。]/g, '、') // Normalize punctuation to just 、
        .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
        // More lenient form variations
        .replace(/ます(って|か)?/g, 'ます') // Keep polite form variations
        .replace(/です(って|か)?/g, 'です') // Keep です variations
        .replace(/[てで]います/g, 'ています') // Keep continuous form
        .replace(/[てで]いる/g, 'ている') // Keep continuous form (plain)
        // More precise ん sound handling
        .replace(/[ンン]/g, 'ん') // Only normalize katakana ン
        .trim();
    };

    const calculateCharacterSimilarity = (text1: string, text2: string) => {
      const chars1 = Array.from(text1);
      const chars2 = Array.from(text2);
      
      // Define similar character groups
      const similarGroups = [
        ['は', 'が', 'わ'], // Particles
        ['に', 'へ'], // Direction particles
        ['を', 'お'], // Object particle
        ['で', 'て'], // Te-form
        ['だ', 'です'], // Copula
        ['ます', 'ました'], // Polite form
      ];
      
      let matches = 0;
      const maxLength = Math.max(chars1.length, chars2.length);
      
      for (let i = 0; i < maxLength; i++) {
        const char1 = chars1[i];
        const char2 = chars2[i];
        
        if (char1 === char2) {
          matches++;
        } else if (char1 && char2) {
          // Check if characters are in the same similar group
          const isSimilar = similarGroups.some(group => 
            group.includes(char1) && group.includes(char2)
          );
          if (isSimilar) matches += 0.8; // Partial match for similar characters
        }
      }
      
      return matches / maxLength;
    };

    const calculateSimilarity = (text1: string, text2: string) => {
      // Split into words for more accurate comparison
      const words1 = text1.split(/[\s、]+/).filter(Boolean);
      const words2 = text2.split(/[\s、]+/).filter(Boolean);
      
      // Calculate word-level similarity
      const wordMatches = words1.filter(word1 => 
        words2.some(word2 => {
          // Consider words similar if they share most characters
          const sharedChars = Array.from(word1).filter(char => word2.includes(char)).length;
          return sharedChars / Math.max(word1.length, word2.length) > 0.7;
        })
      );
      
      // Calculate character-level similarity for unmatched words
      const unmatched1 = words1.filter(word1 => 
        !words2.some(word2 => word1 === word2)
      );
      const unmatched2 = words2.filter(word2 => 
        !words1.some(word1 => word1 === word2)
      );
      
      const charSimilarity = unmatched1.length === 0 && unmatched2.length === 0 ? 1 : 
        calculateCharacterSimilarity(unmatched1.join(''), unmatched2.join(''));
      
      // Weight word matches more heavily than character matches
      const wordScore = wordMatches.length / Math.max(words1.length, words2.length);
      const finalScore = (wordScore * 0.7) + (charSimilarity * 0.3);
      
      return finalScore;
    };

    const calculateAccuracy = (similarity: number) => {
      // More generous scoring scale
      if (similarity >= 0.95) return 100; // Near perfect
      if (similarity >= 0.85) return Math.round(90 + (similarity - 0.85) * 100); // Very good
      if (similarity >= 0.70) return Math.round(70 + (similarity - 0.70) * 133); // Good
      if (similarity >= 0.50) return Math.round(50 + (similarity - 0.50) * 100); // Fair
      return Math.round(similarity * 100); // Below fair
    };

    const normalizedUserInput = normalizeText(transcript);
    const normalizedExpected = normalizeText(currentSegment.japanese);
    
    // If exact match after normalization, return 100%
    if (normalizedUserInput === normalizedExpected) {
      setAccuracy(100);
      return;
    }
    
    // Calculate similarity using the new methods
    const similarity = calculateSimilarity(normalizedUserInput, normalizedExpected);
    const accuracy = calculateAccuracy(similarity);
    
    setAccuracy(accuracy);
  };

  // Handle next/previous segment
  const handleNextSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      cleanupRecognition(); // Stop recording when changing segments
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setTranscript('');
      setAccuracy(0);
    }
  };

  const handlePreviousSegment = () => {
    if (currentSegmentIndex > 0) {
      cleanupRecognition(); // Stop recording when changing segments
      setCurrentSegmentIndex(currentSegmentIndex - 1);
      setTranscript('');
      setAccuracy(0);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 my-4">
      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}
      
      {/* Current segment display */}
      {currentSegment && (
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Segment {currentSegmentIndex + 1} of {segments.length}
            </div>
            <button
              onClick={() => setShowEnglish(!showEnglish)}
              className="text-blue-500 hover:text-blue-600 px-4 py-2 rounded-lg border border-blue-500 hover:border-blue-600"
            >
              {showEnglish ? 'Hide Translation' : 'Show Translation'}
            </button>
          </div>
          <p className="text-lg text-gray-800 dark:text-white mb-2">{currentSegment.japanese}</p>
          {showEnglish && (
            <p className="text-gray-600 dark:text-gray-400">{currentSegment.english}</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Voice selection */}
        <div className="flex items-center space-x-2">
          <select
            className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1"
            onChange={(e) => handleVoiceChange(e.target.value)}
            value={selectedVoice?.name || ''}
          >
            <option value="">Select a voice</option>
            {japaneseVoices.map((voice, index) => {
              const voiceKey = `${voice.name}-${voice.lang}-${voice.voiceURI}-${index}`;
              return (
                <option key={voiceKey} value={voice.name}>
                  {voice.name} {isEnhancedVoice(voice) ? '(Enhanced)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Playback controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePlayAudio}
            disabled={!selectedVoice || isPlaying}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isPlaying ? 'Playing...' : 'Play'}
          </button>
          
          <select
            className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white flex-1"
            value={playbackRate}
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1.0">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
          </select>
        </div>

        {/* Navigation controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePreviousSegment}
            disabled={currentSegmentIndex === 0}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNextSegment}
            disabled={currentSegmentIndex === segments.length - 1}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Recording controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className="flex-1 bg-red-500 text-white px-4 py-2 rounded"
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>

        {/* Transcript display */}
        {(transcript || interimTranscript || isRecording) && (
          <div className="mt-4">
            <h3 className="font-bold text-gray-800 dark:text-white">Your Recording:</h3>
            {interimTranscript && (
              <p className="text-gray-600 dark:text-gray-400 italic">{interimTranscript}</p>
            )}
            {transcript && (
              <>
                <p className="text-gray-700 dark:text-gray-300">{transcript}</p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">Accuracy: {accuracy}%</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 