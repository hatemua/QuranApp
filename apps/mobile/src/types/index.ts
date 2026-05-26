export type {
  SupportedLanguage,
  MasteryState,
  Word as ShapedWord,
  Translation,
  Root,
  Ayah as ShapedAyah,
  AyahWordOccurrence,
} from '@quranic-immersion/shared';

export type {
  AuthMeResponse,
  AuthSessionResponse,
  RegisterRequest,
  LoginRequest,
  RefreshResponse,
  UpdateMeRequest,
  SurahListItem,
  SurahResponse,
  AyahDTO,
  WordInAyahDTO,
  WordDetailResponse,
  RootRef,
  DerivedWord,
  DailyWordsResponse,
  DailyWord,
  SessionStartResponse,
  SessionAnswerRequest,
  SessionAnswerResponse,
  SessionCompleteResponse,
  StreakDay,
  MasteryStats,
} from './api';

import type {MasteryState} from '@quranic-immersion/shared';

export type Word = {
  id: string;
  arabic_text: string;
  transliteration: string;
  meaning: string;
  root: string | null;
  root_frequency: number | null;
  example_ayah?: {
    surah: number;
    ayah: number;
    text_arabic: string;
    text_translation: string;
    audio_url: string;
    highlighted_word_position: number;
  };
  mastery_state: MasteryState;
  audio_url?: string;
};
