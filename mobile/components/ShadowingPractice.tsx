import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { Picker } from '@react-native-picker/picker';
import tw from 'twrnc';
import { ShadowingSegment } from 'shadowpod-shared/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { whisperApiModule } from '../lib/whisperApi';
import { supabase } from '../lib/supabase';
import { compareJapaneseTexts } from '../lib/textComparison';

interface ShadowingPracticeProps {
  segments: ShadowingSegment[] | null;
}

export default function ShadowingPractice({ segments }: ShadowingPracticeProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentSegment, setCurrentSegment] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState('ja-JP');
  const [isMuted, setIsMuted] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<{
    similarity: number;
    differences: {
      added: string[];
      missing: string[];
      matched: string[];
    };
    detailedFeedback: string[];
  } | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = whisperApiModule.onTranscription((result) => {
      if (result.error) {
        setError(result.error);
      } else {
        setTranscription(result.text);
        if (segments && segments[currentSegment]) {
          const comparison = compareJapaneseTexts(
            segments[currentSegment].japanese,
            result.text
          );
          setComparisonResult(comparison);
        }
      }
      setIsProcessing(false);
    });

    return () => {
      unsubscribe();
      whisperApiModule.destroy();
    };
  }, [segments, currentSegment]);

  // Monitor audio status
  useEffect(() => {
    const checkAudioStatus = async () => {
      try {
        // Set up audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        // Instead of checking volume directly, we'll monitor if speech synthesis is available
        const voices = await Speech.getAvailableVoicesAsync();
        setIsMuted(!voices || voices.length === 0);
      } catch (error) {
        console.error('Failed to check audio status:', error);
      }
    };

    checkAudioStatus();
    // Check less frequently to avoid unnecessary API calls
    const interval = setInterval(checkAudioStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playSegment = async (segmentIndex: number) => {
    if (!segments) return;

    try {
      const segment = segments[segmentIndex];
      // Use text-to-speech for now
      await Speech.speak(segment.japanese, {
        language: 'ja-JP',
        rate: playbackRate,
        onDone: () => setIsPlaying(false),
        onError: (error) => {
          console.error('Speech error:', error);
          setIsPlaying(false);
        }
      });
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play segment:', error);
    }
  };

  const handleRecord = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        Alert.alert(
          'Authentication Required',
          'Please sign in to use the recording feature.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (isRecording) {
        setIsProcessing(true);
        await whisperApiModule.stopRecording();
        setIsRecording(false);
      } else {
        setError(null);
        setTranscription('');
        setComparisonResult(null);
        await whisperApiModule.startRecording();
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Recording error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const handleNextSegment = () => {
    if (segments && currentSegment < segments.length - 1) {
      setCurrentSegment(currentSegment + 1);
      setTranscription('');
      setComparisonResult(null);
    }
  };

  const handlePreviousSegment = () => {
    if (currentSegment > 0) {
      setCurrentSegment(currentSegment - 1);
      setTranscription('');
      setComparisonResult(null);
    }
  };

  return (
    <View style={styles.container}>
      {segments && segments[currentSegment] && (
        <>
          <Text style={styles.segmentText}>
            {segments[currentSegment].japanese}
          </Text>
          <TouchableOpacity
            style={styles.translationButton}
            onPress={() => setShowTranslation(!showTranslation)}
          >
            <Text style={styles.translationButtonText}>
              {showTranslation ? 'Hide Translation' : 'Show Translation'}
            </Text>
          </TouchableOpacity>
          {showTranslation && (
            <Text style={styles.translationText}>
              {segments[currentSegment].english}
            </Text>
          )}
        </>
      )}

      {isMuted && (
        <View style={styles.warningContainer}>
          <Ionicons name="volume-mute" size={24} color="#FFA726" />
          <Text style={styles.warningText}>
            Audio is muted. Please check your device's volume.
          </Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => playSegment(currentSegment)}
          disabled={isPlaying || !segments}
        >
          <Text style={styles.buttonText}>
            {isPlaying ? 'Playing...' : 'Play Segment'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            isRecording && styles.recordingButton,
            isProcessing && styles.processingButton
          ]}
          onPress={handleRecord}
          disabled={!segments || isProcessing}
        >
          <Text style={styles.buttonText}>
            {isProcessing ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigationControls}>
        <TouchableOpacity
          style={[styles.navButton, currentSegment === 0 && styles.disabledButton]}
          onPress={handlePreviousSegment}
          disabled={currentSegment === 0}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.segmentCounter}>
          {currentSegment + 1} / {segments?.length || 0}
        </Text>

        <TouchableOpacity
          style={[
            styles.navButton,
            (!segments || currentSegment === segments.length - 1) && styles.disabledButton
          ]}
          onPress={handleNextSegment}
          disabled={!segments || currentSegment === segments.length - 1}
        >
          <Text style={styles.navButtonText}>Next</Text>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {comparisonResult && (
        <View style={styles.comparisonContainer}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Accuracy Score</Text>
            <Text style={[
              styles.scoreValue,
              comparisonResult.similarity >= 90 ? styles.excellentScore :
              comparisonResult.similarity >= 70 ? styles.goodScore :
              comparisonResult.similarity >= 50 ? styles.fairScore :
              styles.poorScore
            ]}>
              {comparisonResult.similarity}%
            </Text>
          </View>

          {comparisonResult.detailedFeedback.map((feedback, index) => (
            <Text key={index} style={styles.feedbackText}>{feedback}</Text>
          ))}

          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionTitle}>Your Recording:</Text>
            <Text style={styles.transcriptionText}>{transcription}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#1a202c',
  },
  segmentText: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  translationButton: {
    backgroundColor: '#2c3e50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  translationButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
  },
  translationText: {
    fontSize: 18,
    color: '#95a5a6',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: '#F57C00',
    marginLeft: 8,
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 12,
    flex: 1,
  },
  recordingButton: {
    backgroundColor: '#e74c3c',
  },
  processingButton: {
    backgroundColor: '#718096',
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    padding: 8,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 14,
    marginHorizontal: 4,
  },
  segmentCounter: {
    color: '#ffffff',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
  },
  comparisonContainer: {
    backgroundColor: '#2d3748',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  excellentScore: {
    color: '#48bb78',
  },
  goodScore: {
    color: '#4299e1',
  },
  fairScore: {
    color: '#ecc94b',
  },
  poorScore: {
    color: '#f56565',
  },
  feedbackText: {
    color: '#e2e8f0',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  transcriptionContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#1a202c',
    borderRadius: 8,
  },
  transcriptionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  transcriptionText: {
    color: '#a0aec0',
    fontSize: 16,
    lineHeight: 24,
  },
}); 