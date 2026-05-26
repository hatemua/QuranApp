import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import {Button} from './Button';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({message, onRetry}: Props) {
  const {t} = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('common.error')}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? (
        <Button label={t('common.retry')} variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {fontFamily: fonts.latinSemibold, fontSize: 18, color: colors.text},
  message: {fontFamily: fonts.latin, fontSize: 14, color: colors.textMuted, textAlign: 'center'},
});
