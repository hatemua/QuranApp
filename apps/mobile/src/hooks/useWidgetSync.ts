import {useEffect, useRef} from 'react';
import {AppState} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useAuthStore} from '@/stores/authStore';
import {wordsApi} from '@/api/words';
import {sessionsApi} from '@/api/sessions';
import {widgetApi} from '@/lib/widget';

/**
 * Keeps the Android home-screen widget in sync with the user's daily words and
 * drains any answers the user gave on the widget back into the backend session
 * pipeline. No-op on iOS or when the widget native module is missing.
 */
export function useWidgetSync(): void {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const lastSyncedRef = useRef<string | null>(null);

  const dailyQuery = useQuery({
    queryKey: ['words', 'daily'],
    queryFn: () => wordsApi.getDaily(),
    enabled: isAuthenticated,
  });

  // Push fresh daily words to the widget whenever the query resolves new data.
  useEffect(() => {
    if (!isAuthenticated) return;
    const data = dailyQuery.data;
    if (!data) return;
    const signature = data.words.map(w => w.word_id).join(',');
    if (signature === lastSyncedRef.current) return;
    lastSyncedRef.current = signature;
    void widgetApi.pushDailyWords(data.words);
  }, [isAuthenticated, dailyQuery.data]);

  // Flush queued widget answers on mount and whenever the app foregrounds.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const flush = async (): Promise<void> => {
      const queued = await widgetApi.flushQueuedAnswers();
      if (cancelled || queued.length === 0) return;
      try {
        const session = await sessionsApi.start();
        for (const a of queued) {
          if (cancelled) return;
          await sessionsApi
            .answer(session.sessionId, {
              wordId: a.wordId,
              correct: a.correct,
              responseTimeMs: 0,
            })
            .catch(() => undefined);
        }
        await sessionsApi.complete(session.sessionId).catch(() => undefined);
      } catch {
        // Re-queue is non-trivial; best-effort sync.
      }
    };

    void flush();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') void flush();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [isAuthenticated]);
}
