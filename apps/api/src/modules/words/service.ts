import {Types} from 'mongoose';
import type {MasteryState, SupportedLanguage} from '@quranic-immersion/shared';
import {UserModel} from '../auth/model.js';
import {QuranWordModel} from '../quran/model.js';
import {UserWordStateModel} from './word-state-model.js';
import {getVersesByChapter, TRANSLATION_ID} from '../../clients/quranCom.js';
import {ayahAudioUrl, wordAudioUrl} from '../../utils/audio.js';
import {ApiError} from '../../utils/errors.js';

export interface ExampleAyah {
  surah: number;
  ayah: number;
  text_arabic: string;
  translation: string;
  audio_url: string;
  highlighted_word_position: number;
}

export interface DailyWord {
  word_id: string;
  arabic_text: string;
  transliteration: string;
  meaning: string;
  root: string | null;
  example_ayah: ExampleAyah;
  audio_url: string;
  mastery_state: MasteryState;
  distractor_meanings: string[];
}

export interface DailyWordsResponse {
  date: string;
  goal: number;
  words: DailyWord[];
  recentlyLearned: DailyWord[];
  streak: Array<{date: string; active: boolean}>;
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
  example_ayahs: ExampleAyah[];
  audio_url: string;
  mastery_state: MasteryState;
  saved: boolean;
}

interface QacOccurrence {
  surah: number;
  ayah: number;
  position: number;
  root: string | null;
  lemma: string | null;
  arabic_text: string;
}

async function findOccurrencesByLemma(lemma: string, limit = 3): Promise<QacOccurrence[]> {
  return QuranWordModel.find({lemma})
    .select('surah ayah position root lemma arabic_text')
    .limit(limit)
    .lean();
}

async function findOccurrencesByArabic(arabic: string, limit = 3): Promise<QacOccurrence[]> {
  return QuranWordModel.find({arabic_text: arabic})
    .select('surah ayah position root lemma arabic_text')
    .limit(limit)
    .lean();
}

async function findOccurrencesForKey(key: string, limit = 3): Promise<QacOccurrence[]> {
  const byLemma = await findOccurrencesByLemma(key, limit);
  if (byLemma.length > 0) return byLemma;
  return findOccurrencesByArabic(key, limit);
}

interface EnrichedWord {
  word_id: string;
  arabic_text: string;
  transliteration: string;
  meaning: string;
  root: string | null;
  example_ayah: ExampleAyah;
  audio_url: string;
  mastery_state: MasteryState;
}

async function enrichOccurrence(
  occ: QacOccurrence,
  lang: SupportedLanguage,
): Promise<EnrichedWord | null> {
  const verses = await getVersesByChapter(occ.surah, lang);
  const verse = verses.find(v => v.verse_number === occ.ayah);
  if (!verse) return null;
  const wordsOnly = verse.words.filter(w => w.char_type_name === 'word');
  const target = wordsOnly[occ.position - 1];
  if (!target) return null;

  const word_id = occ.lemma && occ.lemma.length > 0 ? occ.lemma : (target.text_uthmani ?? target.text ?? occ.arabic_text);
  return {
    word_id,
    arabic_text: target.text_uthmani ?? target.text ?? occ.arabic_text,
    transliteration: target.transliteration?.text ?? '',
    meaning: target.translation?.text ?? '',
    root: occ.root,
    example_ayah: {
      surah: occ.surah,
      ayah: occ.ayah,
      text_arabic: verse.text_uthmani,
      translation: verse.translations[0]?.text ?? '',
      audio_url: ayahAudioUrl(occ.surah, occ.ayah),
      highlighted_word_position: occ.position,
    },
    audio_url: wordAudioUrl(occ.surah, occ.ayah, occ.position),
    mastery_state: 'unseen',
  };
}

async function pickDueLemmas(userId: string, limit: number): Promise<string[]> {
  const now = new Date();
  const rows = await UserWordStateModel.find({userId, next_review_at: {$lte: now}})
    .sort({next_review_at: 1})
    .limit(limit)
    .select('lemma mastery_state')
    .lean();
  return rows.map(r => r.lemma);
}

async function pickFreshLemmas(userId: string, exclude: Set<string>, limit: number): Promise<string[]> {
  if (limit <= 0) return [];
  const seenLemmas = await UserWordStateModel.find({userId}).select('lemma').lean();
  const skip = new Set([...exclude, ...seenLemmas.map(s => s.lemma)]);
  // Group by lemma, sort by occurrence count desc, skip already-seen
  const candidates = await QuranWordModel.aggregate<{_id: string; count: number}>([
    {$match: {lemma: {$nin: [null, '', ...skip]}}},
    {$group: {_id: '$lemma', count: {$sum: 1}}},
    {$sort: {count: -1}},
    {$limit: limit * 3},
  ]);
  const out: string[] = [];
  for (const c of candidates) {
    if (skip.has(c._id)) continue;
    out.push(c._id);
    if (out.length >= limit) break;
  }
  return out;
}

export async function getDaily(userId: string): Promise<DailyWordsResponse> {
  const user = await UserModel.findById(userId);
  if (!user) throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
  const lang = user.preferredLanguage;
  const goal = user.dailyGoal;

  const due = await pickDueLemmas(userId, goal);
  const fresh = await pickFreshLemmas(userId, new Set(due), goal - due.length);
  const lemmas = [...due, ...fresh];

  const stateRows = lemmas.length
    ? await UserWordStateModel.find({userId, lemma: {$in: lemmas}})
        .select('lemma mastery_state')
        .lean()
    : [];
  const stateByLemma = new Map<string, MasteryState>();
  for (const r of stateRows) stateByLemma.set(r.lemma, r.mastery_state);

  const enriched: EnrichedWord[] = [];
  for (const lemma of lemmas) {
    const occs = await findOccurrencesForKey(lemma, 1);
    const occ = occs[0];
    if (!occ) continue;
    const e = await enrichOccurrence(occ, lang);
    if (!e) continue;
    enriched.push({...e, mastery_state: stateByLemma.get(lemma) ?? 'unseen'});
  }

  const meanings = enriched.map(e => e.meaning).filter(m => m.length > 0);
  const words: DailyWord[] = enriched.map(e => ({
    word_id: e.word_id,
    arabic_text: e.arabic_text,
    transliteration: e.transliteration,
    meaning: e.meaning,
    root: e.root,
    example_ayah: e.example_ayah,
    audio_url: e.audio_url,
    mastery_state: e.mastery_state,
    distractor_meanings: pickDistractors(e.meaning, meanings, 3),
  }));

  // Recently learned: last 5 distinct lemmas updated in last 14 days
  const recentRows = await UserWordStateModel.find({
    userId,
    last_reviewed_at: {$gte: new Date(Date.now() - 14 * 86_400_000)},
  })
    .sort({last_reviewed_at: -1})
    .limit(5)
    .select('lemma mastery_state')
    .lean();
  const recentlyLearned: DailyWord[] = [];
  for (const r of recentRows) {
    const occs = await findOccurrencesForKey(r.lemma, 1);
    const occ = occs[0];
    if (!occ) continue;
    const e = await enrichOccurrence(occ, lang);
    if (!e) continue;
    recentlyLearned.push({
      word_id: e.word_id,
      arabic_text: e.arabic_text,
      transliteration: e.transliteration,
      meaning: e.meaning,
      root: e.root,
      example_ayah: e.example_ayah,
      audio_url: e.audio_url,
      mastery_state: r.mastery_state,
      distractor_meanings: [],
    });
  }

  const streak = buildStreakWindow(user.lastActiveDate, user.streakCount);

  return {
    date: new Date().toISOString().slice(0, 10),
    goal,
    words,
    recentlyLearned,
    streak,
  };
}

function pickDistractors(target: string, pool: string[], n: number): string[] {
  const filtered = pool.filter(m => m !== target);
  const shuffled = filtered.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function buildStreakWindow(
  lastActive: Date | null,
  streakCount: number,
): Array<{date: string; active: boolean}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: Array<{date: string; active: boolean}> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const inStreak =
      lastActive !== null &&
      streakCount > 0 &&
      isWithinStreak(d, lastActive, streakCount);
    days.push({date: d.toISOString().slice(0, 10), active: inStreak});
  }
  return days;
}

function isWithinStreak(day: Date, lastActive: Date, streakCount: number): boolean {
  const la = new Date(lastActive);
  la.setHours(0, 0, 0, 0);
  const diff = Math.floor((la.getTime() - day.getTime()) / 86_400_000);
  return diff >= 0 && diff < streakCount;
}

export async function getById(userId: string, lemma: string): Promise<WordDetailResponse> {
  const user = await UserModel.findById(userId);
  if (!user) throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
  const lang = user.preferredLanguage;

  const occs = await findOccurrencesForKey(lemma, 3);
  if (occs.length === 0) throw ApiError.notFound('Word not found', 'WORD_NOT_FOUND');

  const firstOcc = occs[0]!;
  const primary = await enrichOccurrence(firstOcc, lang);
  if (!primary) throw ApiError.notFound('Word not found', 'WORD_NOT_FOUND');

  const example_ayahs: ExampleAyah[] = [];
  for (const occ of occs) {
    const e = await enrichOccurrence(occ, lang);
    if (e) example_ayahs.push(e.example_ayah);
  }

  let root: RootRef | null = null;
  if (firstOcc.root) {
    const family = await QuranWordModel.countDocuments({root: firstOcc.root});
    root = {letters: firstOcc.root, frequency: family};
  }

  const derived: DerivedWord[] = firstOcc.root
    ? await buildDerivedFromRoot(firstOcc.root, lemma, lang)
    : [];

  const state = await UserWordStateModel.findOne({userId, lemma: primary.word_id})
    .select('mastery_state')
    .lean();

  return {
    word_id: primary.word_id,
    arabic_text: primary.arabic_text,
    transliteration: primary.transliteration,
    meaning: primary.meaning,
    root,
    derived,
    example_ayahs,
    audio_url: primary.audio_url,
    mastery_state: state?.mastery_state ?? 'unseen',
    saved: user.savedLemmas.includes(primary.word_id),
  };
}

async function buildDerivedFromRoot(
  root: string,
  excludeLemma: string,
  lang: SupportedLanguage,
): Promise<DerivedWord[]> {
  const grouped = await QuranWordModel.aggregate<{_id: string; count: number; sample: QacOccurrence}>([
    {$match: {root, lemma: {$nin: [null, '', excludeLemma]}}},
    {
      $group: {
        _id: '$lemma',
        count: {$sum: 1},
        sample: {$first: '$$ROOT'},
      },
    },
    {$sort: {count: -1}},
    {$limit: 5},
  ]);
  const out: DerivedWord[] = [];
  for (const g of grouped) {
    const e = await enrichOccurrence(g.sample, lang);
    if (!e) continue;
    out.push({
      word_id: e.word_id,
      arabic_text: e.arabic_text,
      meaning: e.meaning,
      occurrences: g.count,
    });
  }
  return out;
}

export async function saveWord(userId: string, lemma: string): Promise<void> {
  await UserModel.updateOne(
    {_id: new Types.ObjectId(userId)},
    {$addToSet: {savedLemmas: lemma}},
  );
}

export async function unsaveWord(userId: string, lemma: string): Promise<void> {
  await UserModel.updateOne(
    {_id: new Types.ObjectId(userId)},
    {$pull: {savedLemmas: lemma}},
  );
}

export async function getSaved(userId: string): Promise<WordDetailResponse[]> {
  const user = await UserModel.findById(userId);
  if (!user) throw ApiError.unauthorized('User not found', 'USER_NOT_FOUND');
  const out: WordDetailResponse[] = [];
  for (const lemma of user.savedLemmas) {
    try {
      out.push(await getById(userId, lemma));
    } catch {
      // skip missing
    }
  }
  return out;
}

// Force load TRANSLATION_ID symbol to avoid unused warnings (used inline elsewhere).
void TRANSLATION_ID;
