import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import en from '@/i18n/en.json';
import id from '@/i18n/id.json';
import ur from '@/i18n/ur.json';
import {prefs} from '@/lib/storage';
import type {SupportedLanguage} from '@/types';

const SUPPORTED: SupportedLanguage[] = ['en', 'id', 'ur'];

function detectInitialLanguage(): SupportedLanguage {
  const stored = prefs.getLanguage();
  if (stored) return stored;
  const best = RNLocalize.findBestLanguageTag(SUPPORTED);
  const code = best?.languageTag?.split('-')[0];
  if (code === 'en' || code === 'id' || code === 'ur') return code;
  return 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: {translation: en},
    id: {translation: id},
    ur: {translation: ur},
  },
  lng: detectInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {escapeValue: false},
  react: {useSuspense: false},
});

export default i18n;
