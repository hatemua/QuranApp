import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import type { Ayah } from '@quranic-immersion/shared';
import { PATHS } from './paths.js';
import { downloadIfMissing } from './download.js';

const TANZIL_URL =
  'https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=xml&agreed=true';

interface TanzilAya {
  '@_index': string;
  '@_text': string;
}

interface TanzilSura {
  '@_index': string;
  '@_name': string;
  aya: TanzilAya | TanzilAya[];
}

interface TanzilQuran {
  quran: {
    sura: TanzilSura[];
  };
}

async function main(): Promise<void> {
  console.log('[seed-quran] start');
  await downloadIfMissing(TANZIL_URL, PATHS.quranXml);

  const xml = await readFile(PATHS.quranXml, 'utf8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
  });
  const parsed = parser.parse(xml) as TanzilQuran;

  const suras = parsed.quran?.sura;
  if (!Array.isArray(suras)) {
    throw new Error('Unexpected XML structure: quran.sura is missing or not an array');
  }

  const ayahs: Ayah[] = [];
  for (const sura of suras) {
    const surahNum = Number(sura['@_index']);
    const ayas = Array.isArray(sura.aya) ? sura.aya : [sura.aya];
    for (const aya of ayas) {
      const ayahNum = Number(aya['@_index']);
      const text = String(aya['@_text']);
      ayahs.push({ surah: surahNum, ayah: ayahNum, text_arabic: text });
    }
  }

  await mkdir(path.dirname(PATHS.out.quran), { recursive: true });
  await writeFile(PATHS.out.quran, JSON.stringify(ayahs, null, 2), 'utf8');
  console.log(`[seed-quran] wrote ${ayahs.length.toLocaleString()} ayahs → ${PATHS.out.quran}`);

  if (ayahs.length !== 6236) {
    console.warn(`[seed-quran] WARNING: expected 6236 ayahs, got ${ayahs.length}`);
  }
}

main().catch((err: unknown) => {
  console.error('[seed-quran] failed:', err);
  process.exit(1);
});
