import React, {useState} from 'react';
import {I18nManager, Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import Toast from 'react-native-toast-message';
import {Screen} from '@/components/Screen';
import {Button} from '@/components/Button';
import {LoadingState} from '@/components/LoadingState';
import {colors, masteryColor} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import {useAuthStore} from '@/stores/authStore';
import {useSettingsStore} from '@/stores/settingsStore';
import {authApi} from '@/api/auth';
import i18n from '@/lib/i18n';
import type {MasteryState, SupportedLanguage} from '@/types';

const LANG_OPTIONS: SupportedLanguage[] = ['en', 'id', 'ur'];
const GOAL_OPTIONS = [3, 5, 10];
const MASTERY_ORDER: Array<{key: keyof import('@/types').MasteryStats; label: string; state: MasteryState}> = [
  {key: 'seen', label: 'profile.mastery.seen', state: 'seen'},
  {key: 'recognised', label: 'profile.mastery.recognised', state: 'recognised'},
  {key: 'understood', label: 'profile.mastery.understood', state: 'understood'},
  {key: 'retained', label: 'profile.mastery.retained', state: 'retained'},
  {key: 'mastered', label: 'profile.mastery.mastered', state: 'mastered'},
];

export function ProfileScreen() {
  const {t} = useTranslation();
  const user = useAuthStore(s => s.user);
  const setPreferredLanguage = useAuthStore(s => s.setPreferredLanguage);
  const setUser = useAuthStore(s => s.setUser);
  const logout = useAuthStore(s => s.logout);
  const dailyGoal = useSettingsStore(s => s.dailyGoal);
  const setDailyGoal = useSettingsStore(s => s.setDailyGoal);
  const notificationsEnabled = useSettingsStore(s => s.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore(s => s.setNotificationsEnabled);
  const [saving, setSaving] = useState(false);

  if (!user) return <LoadingState />;

  const handleLanguageChange = async (newLang: SupportedLanguage): Promise<void> => {
    if (newLang === user.preferredLanguage) return;
    const oldLang = user.preferredLanguage;
    try {
      setSaving(true);
      const updated = await authApi.updateMe({preferredLanguage: newLang});
      setUser(updated);
      setPreferredLanguage(newLang);
      await i18n.changeLanguage(newLang);
      const wasRtl = oldLang === 'ur';
      const willBeRtl = newLang === 'ur';
      if (wasRtl !== willBeRtl) {
        I18nManager.forceRTL(willBeRtl);
        Toast.show({type: 'info', text1: t('profile.rtlToast'), visibilityTime: 4000});
      }
    } catch {
      Toast.show({type: 'error', text1: t('common.error')});
    } finally {
      setSaving(false);
    }
  };

  const handleDailyGoalChange = async (n: number): Promise<void> => {
    setDailyGoal(n);
    try {
      const updated = await authApi.updateMe({dailyGoal: n});
      setUser(updated);
    } catch {
      // best-effort; local mmkv already updated
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile.stats')}</Text>
          <View style={styles.statBars}>
            {MASTERY_ORDER.map(m => {
              const count = user.masteryStats[m.key];
              return (
                <View key={m.key} style={styles.barRow}>
                  <Text style={styles.barLabel}>{t(m.label)}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(100, count * 4)}%`,
                          backgroundColor: masteryColor(m.state),
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('profile.settings')}</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('profile.language')}</Text>
            <View style={styles.row}>
              {LANG_OPTIONS.map(lang => (
                <Pressable
                  key={lang}
                  disabled={saving}
                  onPress={() => void handleLanguageChange(lang)}
                  style={[
                    styles.pill,
                    user.preferredLanguage === lang && styles.pillActive,
                  ]}>
                  <Text
                    style={[
                      styles.pillText,
                      user.preferredLanguage === lang && styles.pillTextActive,
                    ]}>
                    {t(`auth.languageLabel.${lang}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{t('profile.dailyGoal')}</Text>
            <View style={styles.row}>
              {GOAL_OPTIONS.map(g => (
                <Pressable
                  key={g}
                  onPress={() => void handleDailyGoalChange(g)}
                  style={[styles.pill, dailyGoal === g && styles.pillActive]}>
                  <Text
                    style={[styles.pillText, dailyGoal === g && styles.pillTextActive]}>
                    {t('profile.dailyGoalWords', {count: g})}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{t('profile.notifications')}</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{true: colors.primary, false: colors.border}}
            />
          </View>
        </View>

        <Button
          label={t('profile.logout')}
          variant="secondary"
          onPress={() => void logout()}
          style={styles.logout}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {padding: 20, gap: 24, paddingBottom: 40},
  header: {gap: 4},
  name: {fontFamily: fonts.latinSemibold, fontSize: 22, color: colors.text},
  email: {fontFamily: fonts.latin, fontSize: 14, color: colors.textMuted},
  section: {gap: 12},
  sectionLabel: {
    fontFamily: fonts.latinSemibold,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statBars: {gap: 10},
  barRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  barLabel: {
    fontFamily: fonts.latin,
    fontSize: 13,
    color: colors.text,
    width: 96,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {height: '100%', borderRadius: 4},
  barCount: {fontFamily: fonts.latinSemibold, fontSize: 13, color: colors.textMuted, width: 28, textAlign: 'right'},
  field: {gap: 8},
  fieldRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  fieldLabel: {fontFamily: fonts.latinSemibold, fontSize: 14, color: colors.text},
  row: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: {backgroundColor: colors.primaryMuted, borderColor: colors.primary},
  pillText: {fontFamily: fonts.latin, fontSize: 13, color: colors.textMuted},
  pillTextActive: {color: colors.primary, fontFamily: fonts.latinSemibold},
  logout: {marginTop: 8},
});
