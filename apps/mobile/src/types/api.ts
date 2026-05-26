import type {MasteryState, SupportedLanguage} from '@quranic-immersion/shared';

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthMeResponse;
}

export interface AuthMeResponse {
  id: string;
  email: string;
  displayName: string;
  preferredLanguage: SupportedLanguage;
  dailyGoal: number;
  streakDays: number;
  masteryStats: MasteryStats;
  createdAt: string;
}

export interface MasteryStats {
  seen: number;
  recognised: number;
  understood: number;
  retained: number;
  mastered: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  preferredLanguage: SupportedLanguage;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UpdateMeRequest {
  displayName?: string;
  preferredLanguage?: SupportedLanguage;
  dailyGoal?: number;
}

export interface SurahListItem {
  number: number;
  name_arabic: string;
  name_transliteration: string;
  name_translation: string;
  ayah_count: number;
  revelation_place: 'meccan' | 'medinan';
}

export interface SurahResponse {
  number: number;
  name_arabic: string;
  name_transliteration: string;
  name_translation: string;
  ayah_count: number;
  revelation_place: 'meccan' | 'medinan';
  ayahs: AyahDTO[];
}

export interface AyahDTO {
  surah: number;
  ayah: number;
  text_arabic: string;
  translation: string;
  audio_url: string;
  words: WordInAyahDTO[];
}

export interface WordInAyahDTO {
  word_id: string;
  position: number;
  arabic_text: string;
  transliteration: string;
  meaning: string;
  root: string | null;
  mastery_state: MasteryState;
}

export interface RootRef {
  letters: string;
  frequency: number;
}

export interface DerivedWord {
  word_id: string;
  arabic_text: string;
  meaning: string;
  occurrences: number;
}

export interface WordDetailResponse {
  word_id: string;
  arabic_text: string;
  transliteration: string;
  meaning: string;
  root: RootRef | null;
  derived: DerivedWord[];
  example_ayahs: Array<{
    surah: number;
    ayah: number;
    text_arabic: string;
    translation: string;
    audio_url: string;
    highlighted_word_position: number;
  }>;
  mastery_state: MasteryState;
  saved: boolean;
}

export interface DailyWord {
  word_id: string;
  arabic_text: string;
  transliteration: string;
  meaning: string;
  root: string | null;
  example_ayah: {
    surah: number;
    ayah: number;
    text_arabic: string;
    translation: string;
    audio_url: string;
    highlighted_word_position: number;
  };
  mastery_state: MasteryState;
  distractor_meanings: string[];
}

export interface DailyWordsResponse {
  date: string;
  goal: number;
  words: DailyWord[];
  recentlyLearned: DailyWord[];
  streak: StreakDay[];
}

export interface StreakDay {
  date: string;
  active: boolean;
}

export interface SessionStartResponse {
  sessionId: string;
  words: DailyWord[];
}

export interface SessionAnswerRequest {
  wordId: string;
  correct: boolean;
  responseTimeMs: number;
}

export interface SessionAnswerResponse {
  newMasteryState: MasteryState;
}

export interface SessionCompleteResponse {
  wordsLearned: number;
  accuracy: number;
  newMasteries: Array<{word_id: string; mastery_state: MasteryState}>;
}
