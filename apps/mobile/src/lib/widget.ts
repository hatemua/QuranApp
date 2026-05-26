import {NativeModules, Platform} from 'react-native';
import type {DailyWord} from '@/types';

interface QuranicWidgetNativeModule {
  pushDailyWords(words: DailyWord[]): Promise<void>;
  clearWords(): Promise<void>;
  flushQueuedAnswers(): Promise<Array<{wordId: string; correct: boolean; ts: number}>>;
}

const native: QuranicWidgetNativeModule | null =
  Platform.OS === 'android' ? (NativeModules.QuranicWidget as QuranicWidgetNativeModule) : null;

export interface WidgetQueuedAnswer {
  wordId: string;
  correct: boolean;
  ts: number;
}

export const widgetApi = {
  async pushDailyWords(words: DailyWord[]): Promise<void> {
    if (!native) return;
    try {
      await native.pushDailyWords(words);
    } catch (e) {
      // Widget not critical — swallow errors so they never break the app.
      console.warn('[widget] pushDailyWords failed', e);
    }
  },

  async clearWords(): Promise<void> {
    if (!native) return;
    try {
      await native.clearWords();
    } catch (e) {
      console.warn('[widget] clearWords failed', e);
    }
  },

  async flushQueuedAnswers(): Promise<WidgetQueuedAnswer[]> {
    if (!native) return [];
    try {
      return await native.flushQueuedAnswers();
    } catch (e) {
      console.warn('[widget] flushQueuedAnswers failed', e);
      return [];
    }
  },
};
