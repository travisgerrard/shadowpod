import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

class WhisperApiModule {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;
  private transcriptionCallbacks: ((result: { text: string; error?: string }) => void)[] = [];

  constructor() {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  }

  async startRecording() {
    try {
      if (this.isRecording) {
        throw new Error('Already recording');
      }

      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        throw new Error('Recording permission not granted');
      }

      // Create recording instance
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      await this.recording.startAsync();
      this.isRecording = true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording() {
    try {
      if (!this.recording || !this.isRecording) {
        throw new Error('Not recording');
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.isRecording = false;

      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Create form data for the API request
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'ja');

      // Call Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const transcription = data.text;

      // Notify callbacks
      this.transcriptionCallbacks.forEach(callback => {
        callback({ text: transcription || '' });
      });

      return transcription;
    } catch (error) {
      console.error('Failed to stop recording or transcribe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.transcriptionCallbacks.forEach(callback => {
        callback({ text: '', error: errorMessage });
      });
      throw error;
    }
  }

  onTranscription(callback: (result: { text: string; error?: string }) => void) {
    this.transcriptionCallbacks.push(callback);
    return () => {
      const index = this.transcriptionCallbacks.indexOf(callback);
      if (index > -1) {
        this.transcriptionCallbacks.splice(index, 1);
      }
    };
  }

  destroy() {
    if (this.recording) {
      this.recording.stopAndUnloadAsync();
    }
    this.transcriptionCallbacks = [];
  }
}

export const whisperApiModule = new WhisperApiModule(); 