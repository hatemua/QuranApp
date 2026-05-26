import * as Keychain from 'react-native-keychain';
import {MMKV} from 'react-native-mmkv';
import type {SupportedLanguage} from '@/types';

const KEYCHAIN_SERVICE = 'quranic-immersion';

export interface TokenBundle {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens(tokens: TokenBundle): Promise<void> {
  await Keychain.setGenericPassword('auth', JSON.stringify(tokens), {
    service: KEYCHAIN_SERVICE,
  });
}

export async function getTokens(): Promise<TokenBundle | null> {
  const creds = await Keychain.getGenericPassword({service: KEYCHAIN_SERVICE});
  if (!creds) return null;
  try {
    const parsed = JSON.parse(creds.password) as TokenBundle;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({service: KEYCHAIN_SERVICE});
}

export const mmkv = new MMKV({id: 'quranic-immersion-prefs'});

const KEYS = {
  lastOpenedSurah: 'lastOpenedSurah',
  language: 'language',
  dailyGoal: 'dailyGoal',
  notificationsEnabled: 'notificationsEnabled',
} as const;

export const prefs = {
  getLastOpenedSurah(): number {
    return mmkv.getNumber(KEYS.lastOpenedSurah) ?? 1;
  },
  setLastOpenedSurah(n: number): void {
    mmkv.set(KEYS.lastOpenedSurah, n);
  },
  getLanguage(): SupportedLanguage | null {
    const v = mmkv.getString(KEYS.language);
    if (v === 'en' || v === 'id' || v === 'ur') return v;
    return null;
  },
  setLanguage(lang: SupportedLanguage): void {
    mmkv.set(KEYS.language, lang);
  },
  getDailyGoal(): number {
    return mmkv.getNumber(KEYS.dailyGoal) ?? 5;
  },
  setDailyGoal(n: number): void {
    mmkv.set(KEYS.dailyGoal, n);
  },
  getNotificationsEnabled(): boolean {
    return mmkv.getBoolean(KEYS.notificationsEnabled) ?? false;
  },
  setNotificationsEnabled(v: boolean): void {
    mmkv.set(KEYS.notificationsEnabled, v);
  },
};
