import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {Screen} from '@/components/Screen';
import {Button} from '@/components/Button';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import type {MainStackParamList} from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList, 'SessionSummary'>;
type Rt = RouteProp<MainStackParamList, 'SessionSummary'>;

export function SessionSummaryScreen() {
  const {t} = useTranslation();
  const route = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const {wordsLearned, accuracy} = route.params.result;
  const accuracyPct = Math.round(accuracy * 100);

  return (
    <Screen>
      <View style={styles.body}>
        <Text style={styles.arabicHeader}>{t('summary.header')}</Text>
        <Text style={styles.title}>{t('summary.completed')}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{t('summary.wordsLearned', {count: wordsLearned})}</Text>
          <Text style={styles.stat}>{t('summary.accuracy', {percent: accuracyPct})}</Text>
        </View>
      </View>
      <Button
        label={t('summary.backToToday')}
        onPress={() => nav.popToTop()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16},
  arabicHeader: {
    fontFamily: fonts.arabicBold,
    fontSize: 56,
    color: colors.primary,
    lineHeight: 80,
  },
  title: {fontFamily: fonts.latinSemibold, fontSize: 18, color: colors.text, textAlign: 'center'},
  statsRow: {alignItems: 'center', gap: 4},
  stat: {fontFamily: fonts.latin, fontSize: 14, color: colors.textMuted},
});
