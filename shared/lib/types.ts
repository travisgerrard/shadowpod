export interface StoryContent {
  title: {
    japanese: string;
    english: string;
  };
  japanese: string;
  english: string;
}

export interface ShadowingSegment {
  japanese: string;
  english: string;
}

export interface SpeakingPrompt {
  question: {
    japanese: string;
    english: string;
  };
  modelAnswer: {
    japanese: string;
    english: string;
  };
}

export interface GeneratedContent {
  story: StoryContent;
  shadowingSegments: ShadowingSegment[];
  speakingPrompts: SpeakingPrompt[];
}

export interface UserProfile {
  id: string;
  wanikani_api_token: string | null;
  selected_wanikani_level: string | null;
  encountered_items: Array<{
    vocab: string;
    timestamp: string;
  }>;
  difficult_items: Array<{
    vocab: string;
    reason: string;
  }>;
}

export type ModuleContent = 
  | StoryContent 
  | { segments: ShadowingSegment[]; storyId: string } 
  | { prompts: SpeakingPrompt[]; storyId: string };

export interface UserModule {
  id: string;
  user_id: string;
  module_type: 'story' | 'shadowing' | 'prompt';
  content: ModuleContent;
  created_at: string;
}

export interface VocabItem {
  japanese: string;
  english: string;
  level: string;
}