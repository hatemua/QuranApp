import { Schema, model, type Model } from 'mongoose';

export interface QuranAyahDoc {
  surah: number;
  ayah: number;
  text_arabic: string;
}

const ayahSchema = new Schema<QuranAyahDoc>(
  {
    surah: { type: Number, required: true, min: 1, max: 114 },
    ayah: { type: Number, required: true, min: 1 },
    text_arabic: { type: String, required: true },
  },
  { collection: 'quran_ayahs', versionKey: false }
);
ayahSchema.index({ surah: 1, ayah: 1 }, { unique: true });

export const QuranAyahModel: Model<QuranAyahDoc> = model<QuranAyahDoc>('QuranAyah', ayahSchema);

export interface QuranWordDoc {
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

const wordSchema = new Schema<QuranWordDoc>(
  {
    surah: { type: Number, required: true, min: 1, max: 114 },
    ayah: { type: Number, required: true, min: 1 },
    position: { type: Number, required: true, min: 1 },
    arabic_text: { type: String, required: true },
    root: { type: String, default: null },
    lemma: { type: String, default: null },
    pos: { type: String, default: '' },
    features: { type: String, default: '' },
    transliteration_placeholder: { type: String, default: '' },
  },
  { collection: 'quran_words', versionKey: false }
);
wordSchema.index({ surah: 1, ayah: 1, position: 1 }, { unique: true });
wordSchema.index({ root: 1 });
wordSchema.index({ lemma: 1 });

export const QuranWordModel: Model<QuranWordDoc> = model<QuranWordDoc>('QuranWord', wordSchema);

export interface QuranRootDoc {
  letters: string;
  frequency: number;
}

const rootSchema = new Schema<QuranRootDoc>(
  {
    letters: { type: String, required: true, unique: true },
    frequency: { type: Number, required: true, min: 0 },
  },
  { collection: 'quran_roots', versionKey: false }
);

export const QuranRootModel: Model<QuranRootDoc> = model<QuranRootDoc>('QuranRoot', rootSchema);

export interface TranslationDoc {
  surah: number;
  ayah: number;
  en: string;
  id: string;
  ur: string;
}

const translationSchema = new Schema<TranslationDoc>(
  {
    surah: { type: Number, required: true, min: 1, max: 114 },
    ayah: { type: Number, required: true, min: 1 },
    en: { type: String, default: '' },
    id: { type: String, default: '' },
    ur: { type: String, default: '' },
  },
  { collection: 'translations', versionKey: false }
);
translationSchema.index({ surah: 1, ayah: 1 }, { unique: true });

export const TranslationModel: Model<TranslationDoc> = model<TranslationDoc>(
  'Translation',
  translationSchema
);
