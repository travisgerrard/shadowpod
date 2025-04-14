import { initWhisper } from 'whisper.rn';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    // Initialize Whisper
    const whisperContext = await initWhisper({
      filePath: require('../assets/ggml-tiny.en.bin'),
    });

    // Transcribe the audio
    const { stop, promise } = whisperContext.transcribe(audioPath, {
      language: 'en',
    });

    const { result } = await promise;
    return result;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
} 