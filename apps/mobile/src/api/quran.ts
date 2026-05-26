import {apiFetch} from '@/api/client';
import type {SurahListItem, SurahResponse} from '@/types';

export const quranApi = {
  listSurahs(): Promise<SurahListItem[]> {
    return apiFetch('/quran/surahs');
  },
  getSurah(n: number): Promise<SurahResponse> {
    return apiFetch(`/quran/surah/${n}`);
  },
};
