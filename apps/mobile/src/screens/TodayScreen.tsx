import React, {useCallback} from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {FlashList} from '@shopify/flash-list';
import {useMutation, useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import Toast from 'react-native-toast-message';
import {Screen} from '@/components/Screen';
import {Button} from '@/components/Button';
import {LoadingState} from '@/components/LoadingState';
import {ErrorState} from '@/components/ErrorState';
import {EmptyState} from '@/components/EmptyState';
import {WordCard} from '@/components/WordCard';
import {wordsApi} from '@/api/words';
import {sessionsApi} from '@/api/sessions';
import {useAuthStore} from '@/stores/authStore';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import type {DailyWord, StreakDay} from '@/types';
import type {MainStackParamList} from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export function TodayScreen() {
  const {t} = useTranslation();
  const nav = useNavigation<Nav>();
  const user = useAuthStore(s => s.user);

  const dailyQuery = useQuery({
    queryKey: ['words', 'daily'],
    queryFn: () => wordsApi.getDaily(),
  });

  const startSession = useMutation({
    mutationFn: () => sessionsApi.start(),
    onSuccess: data => {
      nav.navigate('Session', {sessionId: data.sessionId});
    },
    onError: () => {
      Toast.show({type: 'error', text1: t('common.error')});
    },
  });

  const onRefresh = useCallback(() => {
    void dailyQuery.refetch();
  }, [dailyQuery]);

  if (dailyQuery.isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (dailyQuery.error || !dailyQuery.data) {
    return (
      <Screen>
        <ErrorState
          message={(dailyQuery.error as Error | null)?.message}
          onRetry={() => void dailyQuery.refetch()}
        />
      </Screen>
    );
  }

  const data = dailyQuery.data;
  const greeting = t('today.greeting', {name: user?.displayName ?? ''});
  const minutes = Math.max(1, Math.round(data.words.length * 0.6));

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={dailyQuery.isRefetching} onRefresh={onRefresh} />
        }>
        <Text style={styles.greeting}>{greeting}</Text>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{t('today.todaysSession')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('today.sessionDetail', {count: data.words.length, minutes})}
          </Text>
          <Button
            label={t('today.startSession')}
            loading={startSession.isPending}
            onPress={() => startSession.mutate()}
            style={styles.heroBtn}
          />
        </View>

        <View style={styles.streakBlock}>
          <Text style={styles.streakLabel}>
            {t('today.streak', {count: user?.streakDays ?? 0})}
          </Text>
          <View style={styles.streakRow}>
            {data.streak.map((day: StreakDay) => (
              <View
                key={day.date}
                style={[styles.streakDot, day.active && styles.streakDotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.recentBlock}>
          <Text style={styles.sectionLabel}>{t('today.recentlyLearned')}</Text>
          {data.recentlyLearned.length === 0 ? (
            <EmptyState title={t('today.noWordsYet')} />
          ) : (
            <View style={styles.recentList}>
              <FlashList<DailyWord>
                data={data.recentlyLearned}
                horizontal
                keyExtractor={w => w.word_id}
                estimatedItemSize={160}
                renderItem={({item}) => (
                  <WordCard
                    word={item}
                    variant="compact"
                    onPress={() => nav.navigate('WordDetail', {wordId: item.word_id})}
                  />
                )}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {padding: 20, gap: 24, paddingBottom: 40},
  greeting: {fontFamily: fonts.latinSemibold, fontSize: 20, color: colors.text},
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTitle: {fontFamily: fonts.latinSemibold, fontSize: 18, color: colors.text},
  heroSubtitle: {fontFamily: fonts.latin, fontSize: 14, color: colors.textMuted},
  heroBtn: {marginTop: 12},
  streakBlock: {gap: 8},
  streakLabel: {fontFamily: fonts.latin, fontSize: 13, color: colors.textMuted},
  streakRow: {flexDirection: 'row', gap: 8},
  streakDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.border,
  },
  streakDotActive: {backgroundColor: colors.primary},
  recentBlock: {gap: 12},
  sectionLabel: {fontFamily: fonts.latinSemibold, fontSize: 14, color: colors.text},
  recentList: {height: 110},
  sep: {width: 12},
});
