import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Play} from 'lucide-react-native';
import {colors, masteryColor} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import {playUrl} from '@/lib/audio';
import type {AyahDTO} from '@/types';

interface Props {
  ayah: AyahDTO;
  showTranslation?: boolean;
  onWordPress: (wordId: string) => void;
}

export function AyahLine({ayah, showTranslation = true, onWordPress}: Props) {
  const handlePlay = (): void => {
    void playUrl(ayah.audio_url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" onPress={handlePlay} style={styles.playBtn}>
          <Play size={14} color={colors.primary} />
        </Pressable>
        <View style={styles.spacer} />
      </View>

      <View style={styles.wordsRow}>
        {ayah.words.map(word => (
          <Pressable
            key={word.word_id}
            onPress={() => onWordPress(word.word_id)}
            style={styles.wordPressable}>
            <Text
              style={[
                styles.arabicWord,
                {color: masteryColor(word.mastery_state)},
              ]}>
              {word.arabic_text}
            </Text>
          </Pressable>
        ))}
        <View style={styles.ayahBadge}>
          <Text style={styles.ayahNumber}>{ayah.ayah}</Text>
        </View>
      </View>

      {showTranslation ? (
        <Text style={styles.translation}>{ayah.translation}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 6},
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {flex: 1},
  wordsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  wordPressable: {paddingVertical: 4, paddingHorizontal: 3},
  arabicWord: {
    fontFamily: fonts.arabic,
    fontSize: 26,
    lineHeight: 50,
    writingDirection: 'rtl',
  },
  ayahBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    marginVertical: 6,
  },
  ayahNumber: {
    fontFamily: fonts.arabic,
    fontSize: 13,
    color: colors.primary,
  },
  translation: {
    fontFamily: fonts.latin,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: 10,
  },
});
