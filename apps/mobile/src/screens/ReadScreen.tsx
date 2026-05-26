import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import {FlashList} from '@shopify/flash-list';
import {ChevronDown, WifiOff} from 'lucide-react-native';
import {useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {Screen} from '@/components/Screen';
import {LoadingState} from '@/components/LoadingState';
import {ErrorState} from '@/components/ErrorState';
import {AyahLine} from '@/components/AyahLine';
import {SurahPickerSheet} from '@/components/SurahPickerSheet';
import {WordDetailSheet} from '@/components/WordDetailSheet';
import {quranApi} from '@/api/quran';
import {cacheSurah, getCachedSurah} from '@/lib/db';
import {prefs} from '@/lib/storage';
import {useOfflineStatus} from '@/hooks/useOfflineStatus';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import type {AyahDTO} from '@/types';

export function ReadScreen() {
  const {t} = useTranslation();
  const [surahNumber, setSurahNumber] = useState<number>(() => prefs.getLastOpenedSurah());
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const offlineStatus = useOfflineStatus();
  const surahSheetRef = useRef<BottomSheet>(null);
  const wordSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    prefs.setLastOpenedSurah(surahNumber);
  }, [surahNumber]);

  const surahQuery = useQuery({
    queryKey: ['quran', 'surah', surahNumber],
    queryFn: async () => {
      try {
        const data = await quranApi.getSurah(surahNumber);
        void cacheSurah(surahNumber, data);
        setUsingCache(false);
        return data;
      } catch (err) {
        const cached = await getCachedSurah(surahNumber);
        if (cached) {
          setUsingCache(true);
          return cached;
        }
        throw err;
      }
    },
  });

  const surahListQuery = useQuery({
    queryKey: ['quran', 'surahs'],
    queryFn: () => quranApi.listSurahs(),
  });

  const surahs = surahListQuery.data ?? [];
  const surah = surahQuery.data;

  const headerTitle = useMemo(() => {
    if (!surah) return '';
    return `${surah.name_transliteration} • ${surah.name_translation}`;
  }, [surah]);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => surahSheetRef.current?.expand()}
          style={({pressed}) => [styles.pickerPill, pressed && styles.pressed]}>
          <Text style={styles.pickerLabel}>{headerTitle || t('read.selectSurah')}</Text>
          <ChevronDown size={16} color={colors.text} />
        </Pressable>
        {(!offlineStatus.isConnected || usingCache) ? (
          <View style={styles.offlinePill}>
            <WifiOff size={12} color={colors.accent} />
            <Text style={styles.offlineLabel}>{t('read.offline')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        {surahQuery.isLoading ? (
          <LoadingState />
        ) : surahQuery.error && !surah ? (
          <ErrorState
            message={(surahQuery.error as Error).message}
            onRetry={() => void surahQuery.refetch()}
          />
        ) : surah ? (
          <FlashList<AyahDTO>
            data={surah.ayahs}
            keyExtractor={a => `${a.surah}:${a.ayah}`}
            estimatedItemSize={220}
            renderItem={({item}) => (
              <AyahLine
                ayah={item}
                onWordPress={id => {
                  setActiveWord(id);
                  wordSheetRef.current?.expand();
                }}
              />
            )}
          />
        ) : null}
      </View>

      <SurahPickerSheet
        ref={surahSheetRef}
        surahs={surahs}
        selected={surahNumber}
        onSelect={n => {
          setSurahNumber(n);
          surahSheetRef.current?.close();
        }}
      />

      <WordDetailSheet
        ref={wordSheetRef}
        wordId={activeWord}
        onClose={() => setActiveWord(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  pickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {opacity: 0.85},
  pickerLabel: {fontFamily: fonts.latinSemibold, fontSize: 14, color: colors.text},
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.accentMuted,
    borderRadius: 999,
  },
  offlineLabel: {fontFamily: fonts.latin, fontSize: 11, color: colors.accent},
  body: {flex: 1},
});
