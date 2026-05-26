import React, {forwardRef, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {Heart, Plus} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {useQuery} from '@tanstack/react-query';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import {AudioButton} from './AudioButton';
import {LoadingState} from './LoadingState';
import {ErrorState} from './ErrorState';
import {wordsApi} from '@/api/words';

interface Props {
  wordId: string | null;
  onClose: () => void;
}

export const WordDetailSheet = forwardRef<BottomSheet, Props>(function WordDetailSheet(
  {wordId, onClose},
  ref,
) {
  const snapPoints = useMemo(() => ['60%', '90%'], []);

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      index={-1}
      enablePanDownToClose
      onClose={onClose}>
      {wordId ? <SheetContent wordId={wordId} /> : null}
    </BottomSheet>
  );
});

function SheetContent({wordId}: {wordId: string}) {
  const {t} = useTranslation();
  const [savedLocal, setSavedLocal] = useState<boolean | null>(null);

  const {data, isLoading, error, refetch} = useQuery({
    queryKey: ['word', wordId],
    queryFn: () => wordsApi.getById(wordId),
  });

  if (isLoading) return <LoadingState />;
  if (error || !data)
    return <ErrorState onRetry={() => void refetch()} message={(error as Error | null)?.message} />;

  const saved = savedLocal ?? data.saved;
  const onToggleSave = async (): Promise<void> => {
    try {
      setSavedLocal(!saved);
      if (saved) await wordsApi.unsave(data.word_id);
      else await wordsApi.save(data.word_id);
    } catch {
      setSavedLocal(saved);
    }
  };

  const exampleAyah = data.example_ayahs[0];

  return (
    <BottomSheetScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.arabicHuge}>{data.arabic_text}</Text>
      <Text style={styles.translit}>{data.transliteration}</Text>
      <Text style={styles.meaning}>{data.meaning}</Text>

      {data.root ? (
        <View style={styles.section}>
          <Text style={styles.rootLine}>
            {t('word.root')}: {data.root.letters} (
            {t('word.rootCount', {count: data.root.frequency})})
          </Text>
        </View>
      ) : null}

      {exampleAyah ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('word.exampleAyah')}</Text>
          <ExampleAyah text={exampleAyah.text_arabic} highlight={exampleAyah.highlighted_word_position} />
          <Text style={styles.translation}>{exampleAyah.translation}</Text>
          <View style={styles.audioRow}>
            <AudioButton url={exampleAyah.audio_url} reciter={t('word.reciter')} />
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={onToggleSave} style={styles.actionBtn}>
          <Heart size={18} color={saved ? colors.accent : colors.textMuted} fill={saved ? colors.accent : 'transparent'} />
          <Text style={styles.actionLabel}>
            {saved ? t('word.saved') : t('word.save')}
          </Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Plus size={18} color={colors.primary} />
          <Text style={styles.actionLabel}>{t('word.addToReview')}</Text>
        </Pressable>
      </View>
    </BottomSheetScrollView>
  );
}

function ExampleAyah({text, highlight}: {text: string; highlight: number}) {
  const segments = text.split(/\s+/);
  return (
    <View style={styles.arabicRow}>
      {segments.map((seg, idx) => {
        const isHighlight = idx + 1 === highlight;
        return (
          <Text
            key={`${seg}-${idx}`}
            style={[styles.arabicMedium, isHighlight && styles.arabicHighlight]}>
            {seg}{' '}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: 24, gap: 12},
  arabicHuge: {
    fontFamily: fonts.arabicBold,
    fontSize: 40,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 60,
  },
  translit: {
    fontFamily: fonts.latin,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  meaning: {
    fontFamily: fonts.latinSemibold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  section: {gap: 8, marginTop: 8},
  sectionLabel: {
    fontFamily: fonts.latinSemibold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rootLine: {
    fontFamily: fonts.latinSemibold,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  arabicRow: {flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center'},
  arabicMedium: {
    fontFamily: fonts.arabic,
    fontSize: 22,
    color: colors.text,
    lineHeight: 40,
    writingDirection: 'rtl',
  },
  arabicHighlight: {color: colors.accent, fontFamily: fonts.arabicBold},
  translation: {fontFamily: fonts.latin, fontSize: 14, color: colors.textMuted, lineHeight: 22},
  audioRow: {alignItems: 'center', marginTop: 8},
  actions: {flexDirection: 'row', gap: 12, marginTop: 16},
  actionBtn: {
    flex: 1,
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
  actionLabel: {fontFamily: fonts.latinSemibold, fontSize: 14, color: colors.text},
});
