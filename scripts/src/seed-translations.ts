import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { Translation, SupportedLanguage } from '@quranic-immersion/shared';
import { PATHS } from './paths.js';
import { downloadIfMissing } from './download.js';

const TANZIL_TRANS_URL = (transId: string): string =>
  `https://tanzil.net/trans/?transID=${transId}&outType=txt-2&agreed=true`;

const SOURCES: ReadonlyArray<{ lang: SupportedLanguage; transId: string; dest: string }> = [
  { lang: 'en', transId: 'en.sahih', dest: PATHS.translations.en },
  { lang: 'id', transId: 'id.indonesian', dest: PATHS.translations.id },
  { lang: 'ur', transId: 'ur.jalandhry', dest: PATHS.translations.ur },
];

function parseTanzilTxt(text: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const sep = line.indexOf('|');
    if (sep < 0) continue;
    const sep2 = line.indexOf('|', sep + 1);
    if (sep2 < 0) continue;
    const surah = Number(line.slice(0, sep));
    const ayah = Number(line.slice(sep + 1, sep2));
    const text = line.slice(sep2 + 1).trim();
    if (!Number.isInteger(surah) || !Number.isInteger(ayah)) continue;
    result.set(`${surah}:${ayah}`, text);
  }
  return result;
}

async function main(): Promise<void> {
  console.log('[seed-translations] start');

  const maps: Record<SupportedLanguage, Map<string, string>> = {
    en: new Map(),
    id: new Map(),
    ur: new Map(),
  };

  for (const src of SOURCES) {
    await downloadIfMissing(TANZIL_TRANS_URL(src.transId), src.dest);
    const text = await readFile(src.dest, 'utf8');
    maps[src.lang] = parseTanzilTxt(text);
    console.log(`  ${src.lang}: parsed ${maps[src.lang].size.toLocaleString()} lines`);
  }

  const keys = new Set<string>();
  for (const lang of ['en', 'id', 'ur'] as const) {
    for (const k of maps[lang].keys()) keys.add(k);
  }

  const translations: Translation[] = [];
  for (const key of keys) {
    const [sStr, aStr] = key.split(':');
    const surah = Number(sStr);
    const ayah = Number(aStr);
    translations.push({
      surah,
      ayah,
      en: maps.en.get(key) ?? '',
      id: maps.id.get(key) ?? '',
      ur: maps.ur.get(key) ?? '',
    });
  }
  translations.sort((x, y) => x.surah - y.surah || x.ayah - y.ayah);

  await mkdir(path.dirname(PATHS.out.translations), { recursive: true });
  await writeFile(PATHS.out.translations, JSON.stringify(translations, null, 2), 'utf8');
  console.log(
    `[seed-translations] wrote ${translations.length.toLocaleString()} translation rows → ${PATHS.out.translations}`
  );
}

main().catch((err: unknown) => {
  console.error('[seed-translations] failed:', err);
  console.error(
    '\nIf the Tanzil URL is unreachable, place the three plain-text files manually in data/raw/:\n' +
      '  en.sahih.txt, id.indonesian.txt, ur.jalandhry.txt\n' +
      'Each file should contain lines of the form "surah|ayah|translation".'
  );
  process.exit(1);
});
