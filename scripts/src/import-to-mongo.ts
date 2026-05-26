import { readFile } from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import mongoose, { Schema, type Model } from 'mongoose';
import type { Ayah, Word, Root, Translation } from '@quranic-immersion/shared';
import { PATHS, REPO_ROOT } from './paths.js';

dotenv.config({ path: path.join(REPO_ROOT, '.env') });

// Lean schemas for the import step only. The API has its own canonical models
// in apps/api/src/modules/quran/model.ts — slight duplication is acceptable
// at MVP because importing Mongoose models across packages adds tooling weight.
const ayahSchema = new Schema<Ayah>(
  { surah: Number, ayah: Number, text_arabic: String },
  { collection: 'quran_ayahs', versionKey: false }
);
ayahSchema.index({ surah: 1, ayah: 1 }, { unique: true });

const wordSchema = new Schema<Word>(
  {
    surah: Number,
    ayah: Number,
    position: Number,
    arabic_text: String,
    root: { type: String, default: null },
    lemma: { type: String, default: null },
    pos: String,
    features: String,
    transliteration_placeholder: String,
  },
  { collection: 'quran_words', versionKey: false }
);
wordSchema.index({ surah: 1, ayah: 1, position: 1 }, { unique: true });
wordSchema.index({ root: 1 });
wordSchema.index({ lemma: 1 });

const rootSchema = new Schema<Root>(
  { letters: String, frequency: Number },
  { collection: 'quran_roots', versionKey: false }
);
rootSchema.index({ letters: 1 }, { unique: true });

const translationSchema = new Schema<Translation>(
  { surah: Number, ayah: Number, en: String, id: String, ur: String },
  { collection: 'translations', versionKey: false }
);
translationSchema.index({ surah: 1, ayah: 1 }, { unique: true });

const AyahDoc = mongoose.model<Ayah>('ImportAyah', ayahSchema);
const WordDoc = mongoose.model<Word>('ImportWord', wordSchema);
const RootDoc = mongoose.model<Root>('ImportRoot', rootSchema);
const TranslationDoc = mongoose.model<Translation>('ImportTranslation', translationSchema);

async function dropCollectionIfExists(model: Model<unknown>): Promise<void> {
  try {
    await model.collection.drop();
  } catch (err: unknown) {
    // NamespaceNotFound (26) — first run, fine.
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: number }).code !== 26
    ) {
      throw err;
    }
  }
}

async function importCollection<T>(label: string, file: string, model: Model<T>): Promise<void> {
  console.log(`[import] ${label}: reading ${file}`);
  const docs = JSON.parse(await readFile(file, 'utf8')) as T[];
  console.log(`[import] ${label}: dropping existing collection`);
  await dropCollectionIfExists(model as unknown as Model<unknown>);
  console.log(`[import] ${label}: inserting ${docs.length.toLocaleString()} documents`);
  await model.insertMany(docs, { ordered: false });
  await model.createIndexes();
  const count = await model.estimatedDocumentCount();
  console.log(`[import] ${label}: ${count.toLocaleString()} documents in collection`);
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  console.log(`[import] connecting to ${uri}`);
  await mongoose.connect(uri);

  await importCollection<Ayah>('quran_ayahs', PATHS.out.quran, AyahDoc);
  await importCollection<Word>('quran_words', PATHS.out.words, WordDoc);
  await importCollection<Root>('quran_roots', PATHS.out.roots, RootDoc);
  await importCollection<Translation>('translations', PATHS.out.translations, TranslationDoc);

  await mongoose.disconnect();
  console.log('[import] done');
}

main().catch((err: unknown) => {
  console.error('[import] failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
