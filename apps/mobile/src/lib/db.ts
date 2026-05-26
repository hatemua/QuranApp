import {open, type DB} from '@op-engineering/op-sqlite';
import type {SurahResponse} from '@/types';

let db: DB | null = null;
let migrationsPromise: Promise<void> | null = null;

function getDb(): DB {
  if (db) return db;
  db = open({name: 'cache.db'});
  return db;
}

async function ensureMigrations(): Promise<void> {
  if (migrationsPromise) return migrationsPromise;
  migrationsPromise = (async () => {
    const d = getDb();
    await d.execute(`
      CREATE TABLE IF NOT EXISTS cached_surahs (
        surah_number INTEGER PRIMARY KEY,
        payload_json TEXT NOT NULL,
        cached_at INTEGER NOT NULL
      );
    `);
    await d.execute(`
      CREATE TABLE IF NOT EXISTS queued_session_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        word_id TEXT NOT NULL,
        correct INTEGER NOT NULL,
        response_time_ms INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
  })();
  return migrationsPromise;
}

export async function cacheSurah(n: number, payload: SurahResponse): Promise<void> {
  await ensureMigrations();
  await getDb().execute(
    'INSERT OR REPLACE INTO cached_surahs (surah_number, payload_json, cached_at) VALUES (?, ?, ?)',
    [n, JSON.stringify(payload), Date.now()],
  );
}

export async function getCachedSurah(n: number): Promise<SurahResponse | null> {
  await ensureMigrations();
  const result = await getDb().execute(
    'SELECT payload_json FROM cached_surahs WHERE surah_number = ? LIMIT 1',
    [n],
  );
  const row = result.rows?.[0] as {payload_json?: unknown} | undefined;
  const payloadJson = row?.payload_json;
  if (typeof payloadJson !== 'string') return null;
  try {
    return JSON.parse(payloadJson) as SurahResponse;
  } catch {
    return null;
  }
}

export interface QueuedAnswer {
  id: number;
  sessionId: string;
  wordId: string;
  correct: boolean;
  responseTimeMs: number;
  createdAt: number;
}

interface QueuedRow {
  id: number;
  session_id: string;
  word_id: string;
  correct: number;
  response_time_ms: number;
  created_at: number;
}

export async function queueAnswer(input: {
  sessionId: string;
  wordId: string;
  correct: boolean;
  responseTimeMs: number;
}): Promise<void> {
  await ensureMigrations();
  await getDb().execute(
    'INSERT INTO queued_session_answers (session_id, word_id, correct, response_time_ms, created_at) VALUES (?, ?, ?, ?, ?)',
    [input.sessionId, input.wordId, input.correct ? 1 : 0, input.responseTimeMs, Date.now()],
  );
}

export async function getQueuedAnswers(): Promise<QueuedAnswer[]> {
  await ensureMigrations();
  const result = await getDb().execute('SELECT * FROM queued_session_answers ORDER BY id ASC');
  const rows = (result.rows ?? []) as QueuedRow[];
  return rows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    wordId: row.word_id,
    correct: row.correct === 1,
    responseTimeMs: row.response_time_ms,
    createdAt: row.created_at,
  }));
}

export async function deleteQueuedAnswer(id: number): Promise<void> {
  await ensureMigrations();
  await getDb().execute('DELETE FROM queued_session_answers WHERE id = ?', [id]);
}
