import type {FastifyInstance, FastifyRequest} from 'fastify';
import type {MasteryState, SupportedLanguage} from '@quranic-immersion/shared';
import {requireAuth, type AuthedRequest} from '../auth/routes.js';
import {UserModel} from '../auth/model.js';
import {QuranWordModel} from './model.js';
import {UserWordStateModel} from '../words/word-state-model.js';
import {listChapters, getVersesByChapter} from '../../clients/quranCom.js';
import {ayahAudioUrl, wordAudioUrl} from '../../utils/audio.js';
import {ApiError} from '../../utils/errors.js';

interface WordOut {
  word_id: string;
  position: number;
  arabic_text: string;
  transliteration: string;
  meaning: string;
  root: string | null;
  mastery_state: MasteryState;
  audio_url: string;
}

interface AyahOut {
  surah: number;
  ayah: number;
  text_arabic: string;
  translation: string;
  audio_url: string;
  words: WordOut[];
}

interface SurahListItemOut {
  number: number;
  name_arabic: string;
  name_transliteration: string;
  name_translation: string;
  ayah_count: number;
  revelation_place: 'meccan' | 'medinan';
}

interface SurahOut extends SurahListItemOut {
  ayahs: AyahOut[];
}

async function userLanguage(userId: string): Promise<SupportedLanguage> {
  const user = await UserModel.findById(userId).select('preferredLanguage').lean();
  return user?.preferredLanguage ?? 'en';
}

function wordIdFor(lemma: string | null, arabic: string): string {
  return lemma && lemma.length > 0 ? lemma : arabic;
}

export async function registerQuranRoutes(app: FastifyInstance): Promise<void> {
  app.get('/quran/surahs', {preHandler: requireAuth}, async (req: FastifyRequest) => {
    const userId = (req as AuthedRequest).userId;
    const lang = await userLanguage(userId);
    const chapters = await listChapters(lang);
    return chapters.map<SurahListItemOut>(c => ({
      number: c.id,
      name_arabic: c.name_arabic,
      name_transliteration: c.name_simple,
      name_translation: c.translated_name.name,
      ayah_count: c.verses_count,
      revelation_place: c.revelation_place === 'makkah' ? 'meccan' : 'medinan',
    }));
  });

  app.get<{Params: {n: string}}>(
    '/quran/surah/:n',
    {preHandler: requireAuth},
    async req => {
      const n = Number(req.params.n);
      if (!Number.isInteger(n) || n < 1 || n > 114) {
        throw ApiError.badRequest('Invalid surah number', 'INVALID_SURAH');
      }
      const userId = (req as unknown as AuthedRequest).userId;
      const lang = await userLanguage(userId);

      const [chapters, verses, qacWords] = await Promise.all([
        listChapters(lang),
        getVersesByChapter(n, lang),
        QuranWordModel.find({surah: n})
          .select('surah ayah position root lemma')
          .lean(),
      ]);

      const meta = chapters.find(c => c.id === n);
      if (!meta) throw ApiError.notFound('Surah not found', 'SURAH_NOT_FOUND');

      const rootByPos = new Map<string, {root: string | null; lemma: string | null}>();
      for (const qw of qacWords) {
        rootByPos.set(`${qw.surah}:${qw.ayah}:${qw.position}`, {
          root: qw.root,
          lemma: qw.lemma,
        });
      }

      const allLemmas = new Set<string>();
      for (const v of verses) {
        let pos = 0;
        for (const w of v.words) {
          if (w.char_type_name !== 'word') continue;
          pos += 1;
          const meta = rootByPos.get(`${n}:${v.verse_number}:${pos}`);
          allLemmas.add(wordIdFor(meta?.lemma ?? null, w.text_uthmani ?? w.text ?? ''));
        }
      }

      const stateRows = await UserWordStateModel.find({
        userId,
        lemma: {$in: Array.from(allLemmas)},
      })
        .select('lemma mastery_state')
        .lean();
      const stateByLemma = new Map<string, MasteryState>();
      for (const r of stateRows) stateByLemma.set(r.lemma, r.mastery_state);

      const ayahs: AyahOut[] = verses.map(v => {
        const words: WordOut[] = [];
        let pos = 0;
        for (const w of v.words) {
          if (w.char_type_name !== 'word') continue;
          pos += 1;
          const arabic = w.text_uthmani ?? w.text ?? '';
          const m = rootByPos.get(`${n}:${v.verse_number}:${pos}`);
          const wid = wordIdFor(m?.lemma ?? null, arabic);
          words.push({
            word_id: wid,
            position: pos,
            arabic_text: arabic,
            transliteration: w.transliteration?.text ?? '',
            meaning: w.translation?.text ?? '',
            root: m?.root ?? null,
            mastery_state: stateByLemma.get(wid) ?? 'unseen',
            audio_url: wordAudioUrl(n, v.verse_number, pos),
          });
        }
        return {
          surah: n,
          ayah: v.verse_number,
          text_arabic: v.text_uthmani,
          translation: v.translations[0]?.text ?? '',
          audio_url: ayahAudioUrl(n, v.verse_number),
          words,
        };
      });

      const out: SurahOut = {
        number: meta.id,
        name_arabic: meta.name_arabic,
        name_transliteration: meta.name_simple,
        name_translation: meta.translated_name.name,
        ayah_count: meta.verses_count,
        revelation_place: meta.revelation_place === 'makkah' ? 'meccan' : 'medinan',
        ayahs,
      };
      return out;
    },
  );
}
