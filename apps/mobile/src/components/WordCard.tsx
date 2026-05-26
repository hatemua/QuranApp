import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import {AudioButton} from './AudioButton';
import type {DailyWord, WordDetailResponse} from '@/types';

type AnyWord =
  | DailyWord
  | (WordDetailResponse & {example_ayah?: undefined});

interface Props {
  word: AnyWord;
  variant: 'compact' | 'full' | 'session';
  onPress?: () => void;
  revealed?: boolean;
  onReveal?: () => void;
}

export function WordCard({word, variant, onPress, revealed, onReveal}: Props) {
  const {t} = useTranslation();
  const arabic = word.arabic_text;
  const translit = word.transliteration;
  const meaning = word.meaning;
  const root = typeof word.root === 'string' ? word.root : word.root?.letters ?? null;
  const example = 'example_ayah' in word ? word.example_ayah : undefined;
  const wordAudio = 'audio_url' in word ? word.audio_url : undefined;

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        style={({pressed}) => [styles.compact, pressed && styles.pressed]}>
        <Text style={styles.arabicCompact}>{arabic}</Text>
        <Text style={styles.meaningCompact} numberOfLines={2}>
          {meaning}
        </Text>
      </Pressable>
    );
  }

  if (variant === 'session') {
    return (
      <View style={styles.card}>
        <Text style={styles.arabicHuge}>{arabic}</Text>
        <Text style={styles.translit}>{translit}</Text>
        {revealed ? (
          <View style={styles.revealed}>
            <Text style={styles.meaning}>{meaning}</Text>
            {root ? (
              <Text style={styles.root}>
                {t('word.root')}: {root}
              </Text>
            ) : null}
            {wordAudio ? (
              <AudioButton url={wordAudio} reciter={t('word.reciter')} />
            ) : null}
            {example ? <ExampleAyah example={example} /> : null}
          </View>
        ) : (
          <Pressable onPress={onReveal} style={styles.revealBtn}>
            <Text style={styles.revealBtnText}>{t('session.tapToReveal')}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.arabicHuge}>{arabic}</Text>
      <Text style={styles.translit}>{translit}</Text>
      <Text style={styles.meaning}>{meaning}</Text>
      {root ? (
        <Text style={styles.root}>
          {t('word.root')}: {root}
        </Text>
      ) : null}
      {example ? <ExampleAyah example={example} /> : null}
    </View>
  );
}

interface ExampleProps {
  example: NonNullable<DailyWord['example_ayah']>;
}

function ExampleAyah({example}: ExampleProps) {
  const {t} = useTranslation();
  const segments = example.text_arabic.split(/\s+/);
  return (
    <View style={styles.example}>
      <Text style={styles.exampleLabel}>{t('word.exampleAyah')}</Text>
      <View style={styles.arabicRow}>
        {segments.map((seg, idx) => {
          const isHighlight = idx + 1 === example.highlighted_word_position;
          return (
            <Text
              key={`${seg}-${idx}`}
              style={[styles.arabicMedium, isHighlight && styles.arabicHighlight]}>
              {seg}{' '}
            </Text>
          );
        })}
      </View>
      <Text style={styles.translation}>{example.translation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {opacity: 0.85},
  compact: {
    width: 140,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  arabicCompact: {
    fontFamily: fonts.arabicBold,
    fontSize: 24,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  meaningCompact: {
    fontFamily: fonts.latin,
    fontSize: 13,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 12,
  },
  arabicHuge: {
    fontFamily: fonts.arabicBold,
    fontSize: 44,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 64,
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
  root: {
    fontFamily: fonts.latin,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  revealBtn: {
    paddingVertical: 14,
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    alignItems: 'center',
  },
  revealBtnText: {
    fontFamily: fonts.latinSemibold,
    fontSize: 15,
    color: colors.primary,
  },
  revealed: {gap: 10},
  example: {gap: 6, marginTop: 8},
  exampleLabel: {fontFamily: fonts.latin, fontSize: 12, color: colors.textMuted},
  arabicRow: {flexDirection: 'row-reverse', flexWrap: 'wrap', alignItems: 'center'},
  arabicMedium: {
    fontFamily: fonts.arabic,
    fontSize: 22,
    color: colors.text,
    lineHeight: 40,
    writingDirection: 'rtl',
  },
  arabicHighlight: {color: colors.accent, fontFamily: fonts.arabicBold},
  translation: {
    fontFamily: fonts.latin,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
