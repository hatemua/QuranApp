import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Heart} from 'lucide-react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {Screen} from '@/components/Screen';
import {Button} from '@/components/Button';
import {LoadingState} from '@/components/LoadingState';
import {ErrorState} from '@/components/ErrorState';
import {AudioButton} from '@/components/AudioButton';
import {wordsApi} from '@/api/words';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import type {MainStackParamList} from '@/navigation/types';
import type {DerivedWord, WordDetailResponse} from '@/types';

type Nav = NativeStackNavigationProp<MainStackParamList, 'WordDetail'>;
type Rt = RouteProp<MainStackParamList, 'WordDetail'>;

export function WordDetailScreen() {
  const {t} = useTranslation();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const wordId = route.params.wordId;
  const [savedLocal, setSavedLocal] = useState<boolean | null>(null);

  const wordQuery = useQuery({
    queryKey: ['word', wordId],
    queryFn: () => wordsApi.getById(wordId),
  });

  if (wordQuery.isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (wordQuery.error || !wordQuery.data) {
    return (
      <Screen>
        <ErrorState
          onRetry={() => void wordQuery.refetch()}
          message={(wordQuery.error as Error | null)?.message}
        />
      </Screen>
    );
  }

  const word: WordDetailResponse = wordQuery.data;
  const saved = savedLocal ?? word.saved;
  const onToggleSave = async (): Promise<void> => {
    try {
      setSavedLocal(!saved);
      if (saved) await wordsApi.unsave(word.word_id);
      else await wordsApi.save(word.word_id);
    } catch {
      setSavedLocal(saved);
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.arabicHuge}>{word.arabic_text}</Text>
        <Text style={styles.translit}>{word.transliteration}</Text>
        <Text style={styles.meaning}>{word.meaning}</Text>

        {word.root ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('word.root')}</Text>
            <Text style={styles.rootLine}>
              {word.root.letters} — {t('word.rootCount', {count: word.root.frequency})}
            </Text>
          </View>
        ) : null}

        {word.derived.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('word.derived')}</Text>
            <View style={styles.derivedList}>
              {word.derived.map((d: DerivedWord) => (
                <Pressable
                  key={d.word_id}
                  onPress={() => nav.push('WordDetail', {wordId: d.word_id})}
                  style={styles.derivedItem}>
                  <Text style={styles.derivedArabic}>{d.arabic_text}</Text>
                  <Text style={styles.derivedMeaning}>{d.meaning}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {word.example_ayahs.slice(0, 3).map((ex: WordDetailResponse['example_ayahs'][number], idx: number) => (
          <View key={`${ex.surah}-${ex.ayah}-${idx}`} style={styles.exampleBlock}>
            <Text style={styles.sectionLabel}>
              {t('word.exampleAyah')} {ex.surah}:{ex.ayah}
            </Text>
            <Text style={styles.exampleArabic}>{ex.text_arabic}</Text>
            <Text style={styles.exampleTranslation}>{ex.translation}</Text>
            <View style={styles.audioRow}>
              <AudioButton url={ex.audio_url} reciter={t('word.reciter')} size="sm" />
            </View>
          </View>
        ))}

        <View style={styles.actions}>
          <Pressable onPress={onToggleSave} style={styles.saveBtn}>
            <Heart
              size={18}
              color={saved ? colors.accent : colors.textMuted}
              fill={saved ? colors.accent : 'transparent'}
            />
            <Text style={styles.saveLabel}>
              {saved ? t('word.saved') : t('word.save')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <View style={styles.closeWrap}>
        <Button label={t('common.close')} variant="ghost" onPress={() => nav.goBack()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: 24, gap: 16},
  arabicHuge: {
    fontFamily: fonts.arabicBold,
    fontSize: 48,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 72,
  },
  translit: {fontFamily: fonts.latin, fontSize: 18, color: colors.textMuted, textAlign: 'center'},
  meaning: {fontFamily: fonts.latinSemibold, fontSize: 20, color: colors.text, textAlign: 'center'},
  section: {gap: 6, marginTop: 8},
  sectionLabel: {
    fontFamily: fonts.latinSemibold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rootLine: {fontFamily: fonts.latinSemibold, fontSize: 16, color: colors.text},
  derivedList: {gap: 6},
  derivedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  derivedArabic: {
    fontFamily: fonts.arabicBold,
    fontSize: 22,
    color: colors.text,
    writingDirection: 'rtl',
  },
  derivedMeaning: {fontFamily: fonts.latin, fontSize: 14, color: colors.textMuted},
  exampleBlock: {
    gap: 8,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exampleArabic: {
    fontFamily: fonts.arabic,
    fontSize: 24,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 44,
  },
  exampleTranslation: {fontFamily: fonts.latin, fontSize: 14, color: colors.textMuted, lineHeight: 22},
  audioRow: {alignItems: 'center', marginTop: 4},
  actions: {marginTop: 12},
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  saveLabel: {fontFamily: fonts.latinSemibold, fontSize: 14, color: colors.text},
  closeWrap: {paddingHorizontal: 20, paddingBottom: 12},
});
