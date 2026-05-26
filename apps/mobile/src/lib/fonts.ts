export const fonts = {
  arabic: 'Amiri-Regular',
  arabicBold: 'Amiri-Bold',
  latin: 'Inter-Regular',
  latinSemibold: 'Inter-SemiBold',
} as const;

export const arabicTextStyle = {
  fontFamily: fonts.arabic,
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
  lineHeight: 1.8 * 22,
};

export const arabicLargeStyle = {
  fontFamily: fonts.arabicBold,
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
  lineHeight: 1.8 * 40,
};
