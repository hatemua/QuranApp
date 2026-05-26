import {apiFetch} from '@/api/client';
import type {
  SessionAnswerRequest,
  SessionAnswerResponse,
  SessionCompleteResponse,
  SessionStartResponse,
} from '@/types';

export const sessionsApi = {
  start(): Promise<SessionStartResponse> {
    return apiFetch('/sessions/start', {method: 'POST'});
  },
  answer(sessionId: string, input: SessionAnswerRequest): Promise<SessionAnswerResponse> {
    return apiFetch(`/sessions/${sessionId}/answer`, {method: 'POST', body: input});
  },
  complete(sessionId: string): Promise<SessionCompleteResponse> {
    return apiFetch(`/sessions/${sessionId}/complete`, {method: 'POST'});
  },
};
