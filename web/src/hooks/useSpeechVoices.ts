import { useState, useEffect } from 'react';

export interface VoiceState {
  japaneseVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  isAvailable: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useSpeechVoices = () => {
  const [japaneseVoices, setJapaneseVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to check if a voice is enhanced
  const isEnhancedVoice = (voice: SpeechSynthesisVoice): boolean => {
    const nameCheck = voice.name.includes('Enhanced') || 
                     voice.name.includes('Premium') ||
                     voice.name.includes('(高品質)');
    const uriCheck = voice.voiceURI.toLowerCase().includes('premium') || 
                    voice.voiceURI.toLowerCase().includes('enhanced');
    
    return nameCheck || uriCheck;
  };

  // Load available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('Speech synthesis is not supported in this browser');
      setIsAvailable(false);
      setError('Speech synthesis is not supported in this browser');
      return;
    }

    setIsAvailable(true);
    
    const loadVoices = () => {
      // Get all available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Log all voices for debugging
      console.log('All voices with details:', voices.map(v => ({
        name: v.name,
        lang: v.lang,
        uri: v.voiceURI,
        local: v.localService,
        default: v.default,
        enhanced: v.name.includes('Enhanced') || v.name.includes('Premium')
      })));

      // Filter for Japanese voices with enhanced detection
      const japaneseVoices = voices.filter(voice => {
        const isJapanese = voice.lang.startsWith('ja') || 
                          voice.name.toLowerCase().includes('kyoko') ||
                          voice.name.toLowerCase().includes('otoya');
        
        // Log each Japanese voice for debugging
        if (isJapanese) {
          console.log('Found Japanese voice:', {
            name: voice.name,
            lang: voice.lang,
            uri: voice.voiceURI,
            local: voice.localService,
            default: voice.default
          });
        }
        
        return isJapanese;
      });

      // Sort voices with enhanced/premium first
      japaneseVoices.sort((a, b) => {
        const aEnhanced = isEnhancedVoice(a);
        const bEnhanced = isEnhancedVoice(b);
        if (aEnhanced && !bEnhanced) return -1;
        if (!aEnhanced && bEnhanced) return 1;
        return 0;
      });

      setJapaneseVoices(japaneseVoices);

      // Try to find and select an enhanced voice
      const enhancedVoice = japaneseVoices.find(isEnhancedVoice);
      if (enhancedVoice) {
        console.log('Selected enhanced voice:', enhancedVoice.name);
        setSelectedVoice(enhancedVoice);
      } else {
        console.log('No enhanced voice found, using:', japaneseVoices[0]?.name);
        setSelectedVoice(japaneseVoices[0] || null);
      }
    };

    // Initial load
    loadVoices();
    
    // Handle Chrome's async voice loading
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleVoiceChange = (voiceName: string) => {
    const newVoice = japaneseVoices.find(v => v.name === voiceName) || null;
    setSelectedVoice(newVoice);
  };

  return {
    japaneseVoices,
    selectedVoice,
    isAvailable,
    error,
    setError,
    handleVoiceChange,
    isEnhancedVoice
  };
}; 