import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {Pause, Play} from 'lucide-react-native';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import {useAyahAudio} from '@/hooks/useAyahAudio';

interface Props {
  url: string;
  reciter?: string;
  size?: 'sm' | 'md';
}

export function AudioButton({url, reciter, size = 'md'}: Props) {
  const {isPlaying, isLoading, play, pause} = useAyahAudio(url);
  const dim = size === 'sm' ? 32 : 44;
  const iconSize = size === 'sm' ? 16 : 22;

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
        onPress={isPlaying ? pause : play}
        style={({pressed}) => [
          styles.circle,
          {width: dim, height: dim, borderRadius: dim / 2},
          pressed && styles.pressed,
        ]}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : isPlaying ? (
          <Pause size={iconSize} color={colors.primary} />
        ) : (
          <Play size={iconSize} color={colors.primary} />
        )}
      </Pressable>
      {reciter ? <Text style={styles.reciter}>{reciter}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', gap: 4},
  circle: {
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {opacity: 0.7},
  reciter: {fontFamily: fonts.latin, fontSize: 11, color: colors.textMuted},
});
