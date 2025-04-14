import { compareTwoStrings } from 'string-similarity';

interface ComparisonResult {
  similarity: number;
  differences: {
    added: string[];
    missing: string[];
    matched: string[];
  };
  detailedFeedback: string[];
}

// Convert Japanese text to normalized form for better comparison
function normalizeJapaneseText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    // Convert all types of spaces to single space
    .replace(/[\s\u3000]+/g, ' ')
    // Normalize Japanese characters
    .normalize('NFKC')
    // Remove punctuation
    .replace(/[！？。、]/g, '')
    // Remove any remaining whitespace
    .trim();
}

// Split Japanese text into meaningful chunks (words/particles)
function splitJapaneseText(text: string): string[] {
  // This is a simple split - in a production environment, you might want to use
  // a proper Japanese tokenizer like Kuromoji
  return text.split(/[\s\u3000]+/);
}

export function compareJapaneseTexts(target: string, transcribed: string): ComparisonResult {
  const normalizedTarget = normalizeJapaneseText(target);
  const normalizedTranscribed = normalizeJapaneseText(transcribed);

  // Calculate overall similarity
  const similarity = compareTwoStrings(normalizedTarget, normalizedTranscribed);

  // Split into words for detailed comparison
  const targetWords = splitJapaneseText(normalizedTarget);
  const transcribedWords = splitJapaneseText(normalizedTranscribed);

  // Track differences
  const differences = {
    added: [] as string[],
    missing: [] as string[],
    matched: [] as string[],
  };

  // Find matched and missing words
  targetWords.forEach(word => {
    if (transcribedWords.includes(word)) {
      differences.matched.push(word);
    } else {
      differences.missing.push(word);
    }
  });

  // Find added words (words in transcription that weren't in target)
  transcribedWords.forEach(word => {
    if (!targetWords.includes(word)) {
      differences.added.push(word);
    }
  });

  // Generate detailed feedback
  const detailedFeedback = [];

  if (similarity >= 0.9) {
    detailedFeedback.push('素晴らしい！ほぼ完璧です！');
  } else if (similarity >= 0.7) {
    detailedFeedback.push('とてもよくできました！');
  } else if (similarity >= 0.5) {
    detailedFeedback.push('よく頑張りました！もう少し練習しましょう。');
  } else {
    detailedFeedback.push('練習を続けましょう！');
  }

  if (differences.missing.length > 0) {
    detailedFeedback.push(`以下の言葉を含めてみましょう: ${differences.missing.join('、')}`);
  }

  if (differences.added.length > 0) {
    detailedFeedback.push(`余分な言葉がありました: ${differences.added.join('、')}`);
  }

  return {
    similarity: Math.round(similarity * 100),
    differences,
    detailedFeedback,
  };
} 