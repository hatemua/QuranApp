import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';

interface Props {
  message?: string;
}

export function LoadingState({message}: Props) {
  const {t} = useTranslation();
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{message ?? t('common.loading')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24},
  text: {fontFamily: fonts.latin, fontSize: 14, color: colors.textMuted},
});
