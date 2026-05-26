import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Word, Root, Ayah } from '@quranic-immersion/shared';
import { PATHS } from './paths.js';
import { downloadIfMissing } from './download.js';
import { buckwalterToArabic } from './buckwalter.js';

// corpus.quran.com's "Download" page requires submitting an email address through a web form,
// so direct scripted download isn't possible there. The CLTK (Classical Language Toolkit)
// project hosts a public mirror of the exact same v0.4 morphology .txt file on GitHub.
const QAC_TXT_URL =
  'https://raw.githubusercontent.com/cltk/arabic_morphology_quranic-corpus/master/quranic-corpus-morphology-0.4.txt';

interface AggregatedWord {
  root: string | null;
  lemma: string | null;
  pos: string;
  features: string;
}

async function main(): Promise<void> {
  console.log('[seed-corpus] start');
  await downloadIfMissing(QAC_TXT_URL, PATHS.qacTxt);

  if (!existsSync(PATHS.out.quran)) {
    throw new Error(
      `Expected ${PATHS.out.quran} to exist. Run pnpm seed:quran first so word positions can be aligned to Tanzil Arabic text.`
    );
  }
  const ayahsRaw = JSON.parse(await readFile(PATHS.out.quran, 'utf8')) as Ayah[];
  const ayahWords = new Map<string, string[]>();
  for (const a of ayahsRaw) {
    ayahWords.set(`${a.surah}:${a.ayah}`, a.text_arabic.split(/\s+/).filter(Boolean));
  }

  const txt = await readFile(PATHS.qacTxt, 'utf8');
  const lines = txt.split(/\r?\n/);
  const wordMap = new Map<string, AggregatedWord>();
  const locRegex = /^\((\d+):(\d+):(\d+):(\d+)\)$/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 4) continue;
    const [loc, , tag, features] = parts as [string, string, string, string];
    const m = locRegex.exec(loc);
    if (!m) continue;
    const s = Number(m[1]);
    const a = Number(m[2]);
    const w = Number(m[3]);
    const key = `${s}:${a}:${w}`;

    let agg = wordMap.get(key);
    if (!agg) {
      agg = { root: null, lemma: null, pos: '', features: '' };
      wordMap.set(key, agg);
    }

    for (const featPart of features.split('|')) {
      if (featPart.startsWith('ROOT:')) {
        agg.root = buckwalterToArabic(featPart.slice(5));
      } else if (featPart.startsWith('LEM:')) {
        agg.lemma = buckwalterToArabic(featPart.slice(4));
      } else if (featPart.startsWith('POS:')) {
        agg.pos = featPart.slice(4);
      }
    }
    if (!agg.pos) agg.pos = tag;
    agg.features += (agg.features ? ' ' : '') + features;
  }

  const words: Word[] = [];
  for (const [key, agg] of wordMap) {
    const [sStr, aStr, wStr] = key.split(':');
    const s = Number(sStr);
    const a = Number(aStr);
    const w = Number(wStr);
    const arr = ayahWords.get(`${s}:${a}`);
    const arabic = arr?.[w - 1] ?? '';
    words.push({
      surah: s,
      ayah: a,
      position: w,
      arabic_text: arabic,
      root: agg.root,
      lemma: agg.lemma,
      pos: agg.pos,
      features: agg.features,
      transliteration_placeholder: '',
    });
  }

  words.sort((x, y) => x.surah - y.surah || x.ayah - y.ayah || x.position - y.position);

  await mkdir(path.dirname(PATHS.out.words), { recursive: true });
  await writeFile(PATHS.out.words, JSON.stringify(words, null, 2), 'utf8');
  console.log(`[seed-corpus] wrote ${words.length.toLocaleString()} words → ${PATHS.out.words}`);

  const rootCounts = new Map<string, number>();
  for (const word of words) {
    if (word.root) {
      rootCounts.set(word.root, (rootCounts.get(word.root) ?? 0) + 1);
    }
  }
  const roots: Root[] = Array.from(rootCounts.entries())
    .map(([letters, frequency]) => ({ letters, frequency }))
    .sort((x, y) => y.frequency - x.frequency);

  await writeFile(PATHS.out.roots, JSON.stringify(roots, null, 2), 'utf8');
  console.log(`[seed-corpus] wrote ${roots.length.toLocaleString()} roots → ${PATHS.out.roots}`);
}

main().catch((err: unknown) => {
  console.error('[seed-corpus] failed:', err);
  console.error(
    '\nIf the CLTK mirror is unreachable, you can:\n' +
      '  1. Visit https://corpus.quran.com/download/ and submit the email form to get the original .txt\n' +
      `  2. Place the resulting quranic-corpus-morphology-0.4.txt at ${PATHS.qacTxt}\n` +
      '  3. Re-run pnpm seed:corpus\n'
  );
  process.exit(1);
});
