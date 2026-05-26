import {useEffect, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {apiFetch} from '@/api/client';
import {deleteQueuedAnswer, getQueuedAnswers} from '@/lib/db';

interface OfflineStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
}

let flushInFlight = false;

async function flushQueuedAnswers(): Promise<void> {
  if (flushInFlight) return;
  flushInFlight = true;
  try {
    const queued = await getQueuedAnswers();
    for (const q of queued) {
      try {
        await apiFetch(`/sessions/${q.sessionId}/answer`, {
          method: 'POST',
          body: {wordId: q.wordId, correct: q.correct, responseTimeMs: q.responseTimeMs},
        });
        await deleteQueuedAnswer(q.id);
      } catch {
        break;
      }
    }
  } finally {
    flushInFlight = false;
  }
}

export function useOfflineStatus(): OfflineStatus {
  const [status, setStatus] = useState<OfflineStatus>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    let lastConnected = true;
    const unsub = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      const reachable = state.isInternetReachable ?? connected;
      setStatus({isConnected: connected, isInternetReachable: reachable});
      if (!lastConnected && connected) {
        void flushQueuedAnswers();
      }
      lastConnected = connected;
    });
    return () => {
      unsub();
    };
  }, []);

  return status;
}
