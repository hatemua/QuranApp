import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Controller, useForm} from 'react-hook-form';
import {useTranslation} from 'react-i18next';
import Toast from 'react-native-toast-message';
import {z} from 'zod';
import {Screen} from '@/components/Screen';
import {Button} from '@/components/Button';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import {authApi} from '@/api/auth';
import {useAuthStore} from '@/stores/authStore';
import type {AuthStackParamList} from '@/navigation/types';
import type {SupportedLanguage} from '@/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const LANG_OPTIONS: SupportedLanguage[] = ['en', 'id', 'ur'];

const buildSchema = (t: (k: string) => string) =>
  z.object({
    email: z.string().email(t('validation.emailInvalid')),
    password: z.string().min(8, t('validation.passwordShort')),
    displayName: z.string().min(1, t('validation.displayNameRequired')),
    preferredLanguage: z.enum(['en', 'id', 'ur']),
  });

type FormValues = {
  email: string;
  password: string;
  displayName: string;
  preferredLanguage: SupportedLanguage;
};

export function RegisterScreen() {
  const nav = useNavigation<Nav>();
  const {t, i18n} = useTranslation();
  const setSession = useAuthStore(s => s.setSession);
  const [submitting, setSubmitting] = useState(false);

  const schema = buildSchema(t);
  const {control, handleSubmit, formState} = useForm<FormValues>({
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
      preferredLanguage: (i18n.language as SupportedLanguage | undefined) ?? 'en',
    },
  });

  const onSubmit = async (values: FormValues): Promise<void> => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      Toast.show({type: 'error', text1: t('common.error')});
      return;
    }
    try {
      setSubmitting(true);
      const result = await authApi.register(parsed.data);
      await setSession(result.user, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch {
      Toast.show({type: 'error', text1: t('auth.genericFailure')});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>{t('auth.register')}</Text>
      <View style={styles.fields}>
        <Controller
          control={control}
          name="displayName"
          rules={{required: true}}
          render={({field}) => (
            <View>
              <Text style={styles.label}>{t('auth.displayName')}</Text>
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                style={styles.input}
              />
              {formState.errors.displayName ? (
                <Text style={styles.fieldError}>{t('validation.displayNameRequired')}</Text>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="email"
          rules={{required: true}}
          render={({field}) => (
            <View>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
              />
              {formState.errors.email ? (
                <Text style={styles.fieldError}>{t('validation.emailInvalid')}</Text>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="password"
          rules={{required: true, minLength: 8}}
          render={({field}) => (
            <View>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                secureTextEntry
                style={styles.input}
              />
              {formState.errors.password ? (
                <Text style={styles.fieldError}>{t('validation.passwordShort')}</Text>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="preferredLanguage"
          render={({field}) => (
            <View>
              <Text style={styles.label}>{t('auth.preferredLanguage')}</Text>
              <View style={styles.langRow}>
                {LANG_OPTIONS.map(opt => (
                  <Pressable
                    key={opt}
                    onPress={() => field.onChange(opt)}
                    style={[
                      styles.langPill,
                      field.value === opt && styles.langPillActive,
                    ]}>
                    <Text
                      style={[
                        styles.langText,
                        field.value === opt && styles.langTextActive,
                      ]}>
                      {t(`auth.languageLabel.${opt}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />
      </View>
      <View style={styles.actions}>
        <Button
          label={t('auth.registerCta')}
          loading={submitting}
          onPress={handleSubmit(onSubmit)}
        />
        <Button label={t('common.back')} variant="ghost" onPress={() => nav.goBack()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.latinSemibold,
    fontSize: 28,
    color: colors.text,
    marginTop: 20,
    marginBottom: 24,
  },
  fields: {gap: 16, flex: 1},
  label: {fontFamily: fonts.latin, fontSize: 13, color: colors.textMuted, marginBottom: 6},
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.latin,
    fontSize: 16,
    color: colors.text,
  },
  fieldError: {
    fontFamily: fonts.latin,
    fontSize: 12,
    color: colors.accent,
    marginTop: 4,
  },
  langRow: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
  langPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  langPillActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  langText: {fontFamily: fonts.latin, fontSize: 14, color: colors.textMuted},
  langTextActive: {color: colors.primary, fontFamily: fonts.latinSemibold},
  actions: {gap: 10, paddingBottom: 12},
});
