import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// __dirname is .../quranic-immersion/scripts/src — repo root is two levels up.
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
export const DATA_DIR = path.join(REPO_ROOT, 'data');
export const RAW_DIR = path.join(DATA_DIR, 'raw');
export const PROCESSED_DIR = path.join(DATA_DIR, 'processed');

export const PATHS = {
  quranXml: path.join(RAW_DIR, 'quran-uthmani.xml'),
  qacZip: path.join(RAW_DIR, 'quranic-corpus-morphology-0.4.zip'),
  qacTxt: path.join(RAW_DIR, 'quranic-corpus-morphology-0.4.txt'),
  translations: {
    en: path.join(RAW_DIR, 'en.sahih.txt'),
    id: path.join(RAW_DIR, 'id.indonesian.txt'),
    ur: path.join(RAW_DIR, 'ur.jalandhry.txt'),
  },
  out: {
    quran: path.join(PROCESSED_DIR, 'quran.json'),
    words: path.join(PROCESSED_DIR, 'words.json'),
    roots: path.join(PROCESSED_DIR, 'roots.json'),
    translations: path.join(PROCESSED_DIR, 'translations.json'),
  },
} as const;
