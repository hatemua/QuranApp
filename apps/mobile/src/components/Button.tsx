import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantBg: Record<Variant, ViewStyle> = {
  primary: {backgroundColor: colors.primary},
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {backgroundColor: 'transparent'},
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  leftIcon,
  rightIcon,
}: Props) {
  const isDisabled = disabled || loading;
  const labelColor = variant === 'primary' ? '#FFFFFF' : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{color: 'rgba(255,255,255,0.18)'}}
      style={[styles.base, variantBg[variant], isDisabled && styles.disabled, style]}>
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : colors.primary} />
        ) : (
          <>
            {leftIcon}
            <Text style={[styles.label, {color: labelColor}]}>{label}</Text>
            {rightIcon}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    overflow: 'hidden',
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: 8},
  disabled: {opacity: 0.5},
  label: {fontFamily: fonts.latinSemibold, fontSize: 16},
});
