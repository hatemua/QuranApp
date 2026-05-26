import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {Screen} from '@/components/Screen';
import {Button} from '@/components/Button';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import type {AuthStackParamList} from '@/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const nav = useNavigation<Nav>();
  const {t} = useTranslation();

  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.hero}>
          <Text style={styles.arabicTitle}>قُرْآن</Text>
          <Text style={styles.title}>{t('auth.welcomeTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.welcomeSubtitle')}</Text>
        </View>
        <Text style={styles.tagline}>{t('auth.tagline')}</Text>
      </View>
      <View style={styles.actions}>
        <Button label={t('auth.getStarted')} onPress={() => nav.navigate('Register')} />
        <Button
          label={t('auth.haveAccount')}
          variant="ghost"
          onPress={() => nav.navigate('Login')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 32},
  hero: {alignItems: 'center', gap: 12},
  arabicTitle: {
    fontFamily: fonts.arabicBold,
    fontSize: 64,
    color: colors.primary,
    lineHeight: 80,
  },
  title: {fontFamily: fonts.latinSemibold, fontSize: 24, color: colors.text},
  subtitle: {
    fontFamily: fonts.latin,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  tagline: {
    fontFamily: fonts.latin,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontStyle: 'italic',
  },
  actions: {gap: 10, paddingBottom: 12},
});
