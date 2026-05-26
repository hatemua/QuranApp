import {apiFetch} from '@/api/client';
import type {DailyWordsResponse, WordDetailResponse} from '@/types';

export const wordsApi = {
  getDaily(): Promise<DailyWordsResponse> {
    return apiFetch('/words/daily');
  },
  getById(id: string): Promise<WordDetailResponse> {
    return apiFetch(`/words/${id}`);
  },
  search(q: string): Promise<WordDetailResponse[]> {
    const qs = encodeURIComponent(q);
    return apiFetch(`/words/search?q=${qs}`);
  },
  save(id: string): Promise<void> {
    return apiFetch(`/words/${id}/save`, {method: 'POST'});
  },
  unsave(id: string): Promise<void> {
    return apiFetch(`/words/${id}/save`, {method: 'DELETE'});
  },
  getSaved(): Promise<WordDetailResponse[]> {
    return apiFetch('/words/saved');
  },
};
