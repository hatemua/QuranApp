import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';

interface Props {
  title: string;
  message?: string;
}

export function EmptyState({title, message}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24},
  title: {fontFamily: fonts.latinSemibold, fontSize: 16, color: colors.text},
  message: {fontFamily: fonts.latin, fontSize: 14, color: colors.textMuted, textAlign: 'center'},
});
