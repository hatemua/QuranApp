import type {SupportedLanguage} from '@quranic-immersion/shared';
import {ApiError} from '../utils/errors.js';

const BASE = 'https://api.quran.com/api/v4';
const TTL_MS = 1000 * 60 * 60 * 24; // 24h

export const TRANSLATION_ID: Record<SupportedLanguage, number> = {
  en: 20, // Sahih International
  id: 33, // Indonesian Ministry of Religious Affairs (Kemenag)
  ur: 158, // Fateh Jalandhry
};

// Quran.com uses 'urdu', 'indonesian', 'english' for word_translation_language.
const WORD_LANG: Record<SupportedLanguage, string> = {
  en: 'english',
  id: 'indonesian',
  ur: 'urdu',
};

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.data as T;
}

function cacheSet<T>(key: string, data: T): void {
  cache.set(key, {data, expiresAt: Date.now() + TTL_MS});
}

async function fetchJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw ApiError.upstream(`Quran.com fetch failed: ${(e as Error).message}`);
  }
  if (!res.ok) {
    throw ApiError.upstream(`Quran.com ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

export interface QuranComChapter {
  id: number;
  revelation_place: 'makkah' | 'madinah';
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: [number, number];
  translated_name: {language_name: string; name: string};
}

interface ChaptersResponse {
  chapters: QuranComChapter[];
}

export async function listChapters(lang: SupportedLanguage): Promise<QuranComChapter[]> {
  const key = `chapters:${lang}`;
  const cached = cacheGet<QuranComChapter[]>(key);
  if (cached) return cached;
  const url = `${BASE}/chapters?language=${WORD_LANG[lang]}`;
  const data = await fetchJson<ChaptersResponse>(url);
  cacheSet(key, data.chapters);
  return data.chapters;
}

export interface QuranComWord {
  id: number;
  position: number;
  audio_url: string | null;
  char_type_name: 'word' | 'end' | 'pause' | 'rub-el-hizb' | 'sajdah';
  text_uthmani?: string;
  text?: string;
  translation?: {text: string; language_name: string};
  transliteration?: {text: string; language_name: string};
}

export interface QuranComVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  words: QuranComWord[];
  translations: Array<{id: number; resource_id: number; text: string}>;
}

interface VersesResponse {
  verses: QuranComVerse[];
  pagination?: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

export async function getVersesByChapter(
  surah: number,
  lang: SupportedLanguage,
): Promise<QuranComVerse[]> {
  const key = `verses:${surah}:${lang}`;
  const cached = cacheGet<QuranComVerse[]>(key);
  if (cached) return cached;

  const translationId = TRANSLATION_ID[lang];
  const wordLang = WORD_LANG[lang];
  const params = new URLSearchParams({
    words: 'true',
    translations: String(translationId),
    word_translation_language: wordLang,
    fields: 'text_uthmani',
    word_fields: 'text_uthmani,transliteration',
    per_page: '300',
  });
  const url = `${BASE}/verses/by_chapter/${surah}?${params.toString()}`;
  const data = await fetchJson<VersesResponse>(url);
  cacheSet(key, data.verses);
  return data.verses;
}

export interface QuranComWordDetail {
  id: number;
  position: number;
  text_uthmani: string;
  verse_key: string;
  translation: {text: string};
  transliteration: {text: string};
}

interface WordDetailResponse {
  word: QuranComWordDetail;
}

export async function getWord(
  wordKey: string, // e.g. "1:1:1"
  lang: SupportedLanguage,
): Promise<QuranComWordDetail> {
  const key = `word:${wordKey}:${lang}`;
  const cached = cacheGet<QuranComWordDetail>(key);
  if (cached) return cached;
  const wordLang = WORD_LANG[lang];
  const url = `${BASE}/words/${encodeURIComponent(wordKey)}?word_translation_language=${wordLang}`;
  const data = await fetchJson<WordDetailResponse>(url);
  cacheSet(key, data.word);
  return data.word;
}
