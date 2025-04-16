export interface VocabItem {
  japanese: string;
  english: string;
  reading: string;
}

export interface GrammarItem {
  pattern: string;
  meaning: string;
  example: string;
}

export const n5Vocab: VocabItem[] = [
  { japanese: '私', english: 'I, me', reading: 'わたし' },
  { japanese: 'あなた', english: 'you', reading: 'あなた' },
  { japanese: '人', english: 'person', reading: 'ひと' },
  { japanese: '本', english: 'book', reading: 'ほん' },
  { japanese: '水', english: 'water', reading: 'みず' },
  { japanese: '食べる', english: 'to eat', reading: 'たべる' },
  { japanese: '飲む', english: 'to drink', reading: 'のむ' },
  { japanese: '行く', english: 'to go', reading: 'いく' },
  { japanese: '来る', english: 'to come', reading: 'くる' },
  { japanese: '見る', english: 'to see, to look', reading: 'みる' },
  { japanese: '聞く', english: 'to listen, to ask', reading: 'きく' },
  { japanese: '話す', english: 'to speak', reading: 'はなす' },
  { japanese: '読む', english: 'to read', reading: 'よむ' },
  { japanese: '書く', english: 'to write', reading: 'かく' },
  { japanese: '買う', english: 'to buy', reading: 'かう' },
  { japanese: '売る', english: 'to sell', reading: 'うる' },
  { japanese: '大きい', english: 'big', reading: 'おおきい' },
  { japanese: '小さい', english: 'small', reading: 'ちいさい' },
  { japanese: '新しい', english: 'new', reading: 'あたらしい' },
  { japanese: '古い', english: 'old', reading: 'ふるい' },
  { japanese: '高い', english: 'expensive, tall', reading: 'たかい' },
  { japanese: '安い', english: 'cheap', reading: 'やすい' },
  { japanese: '良い', english: 'good', reading: 'いい' },
  { japanese: '悪い', english: 'bad', reading: 'わるい' },
  { japanese: '多い', english: 'many', reading: 'おおい' },
  { japanese: '少ない', english: 'few', reading: 'すくない' },
  { japanese: '難しい', english: 'difficult', reading: 'むずかしい' },
  { japanese: '易しい', english: 'easy', reading: 'やさしい' },
  { japanese: '早い', english: 'early, fast', reading: 'はやい' },
  { japanese: '遅い', english: 'late, slow', reading: 'おそい' }
];

export const n5Grammar: GrammarItem[] = [
  { 
    pattern: 'NはNです', 
    meaning: 'N is N', 
    example: '私は学生です。 (I am a student.)' 
  },
  { 
    pattern: 'NがAdjです', 
    meaning: 'N is Adj', 
    example: 'この本は面白いです。 (This book is interesting.)' 
  },
  { 
    pattern: 'NをVます', 
    meaning: 'Do V to N', 
    example: '本を読みます。 (I read a book.)' 
  },
  { 
    pattern: 'NにVます', 
    meaning: 'Do V at N', 
    example: '学校に行きます。 (I go to school.)' 
  },
  { 
    pattern: 'NでVます', 
    meaning: 'Do V at N (place)', 
    example: 'レストランで食べます。 (I eat at a restaurant.)' 
  },
  { 
    pattern: 'NとVます', 
    meaning: 'Do V with N', 
    example: '友達と話します。 (I talk with my friend.)' 
  },
  { 
    pattern: 'NからVます', 
    meaning: 'Do V from N', 
    example: '家から来ます。 (I come from home.)' 
  },
  { 
    pattern: 'NまでVます', 
    meaning: 'Do V until N', 
    example: '駅まで歩きます。 (I walk to the station.)' 
  },
  { 
    pattern: 'NもVます', 
    meaning: 'Also do V', 
    example: '私も行きます。 (I will also go.)' 
  },
  { 
    pattern: 'NしかVません', 
    meaning: 'Only do V', 
    example: '水しか飲みません。 (I only drink water.)' 
  }
]; 