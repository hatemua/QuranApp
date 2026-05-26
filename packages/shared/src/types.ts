export type SupportedLanguage = 'en' | 'id' | 'ur';

export type MasteryState =
  | 'unseen'
  | 'seen'
  | 'recognised'
  | 'understood'
  | 'retained'
  | 'mastered';

export interface Ayah {
  surah: number;
  ayah: number;
  text_arabic: string;
}

export interface Translation {
  surah: number;
  ayah: number;
  en: string;
  id: string;
  ur: string;
}

export interface Root {
  letters: string;
  frequency: number;
}

export interface Word {
  surah: number;
  ayah: number;
  position: number;
  arabic_text: string;
  root: string | null;
  lemma: string | null;
  pos: string;
  features: string;
  transliteration_placeholder: string;
}

export interface AyahWordOccurrence {
  surah: number;
  ayah: number;
  position: number;
  arabic_text: string;
}

export interface UserWordState {
  userId: string;
  wordKey: string;
  mastery_state: MasteryState;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  error_count: number;
  next_review_at: Date;
  last_reviewed_at: Date | null;
}
