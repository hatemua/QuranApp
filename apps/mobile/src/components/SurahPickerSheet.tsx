import React, {forwardRef, useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {FlashList} from '@shopify/flash-list';
import {useTranslation} from 'react-i18next';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import type {SurahListItem} from '@/types';

interface Props {
  surahs: SurahListItem[];
  selected: number;
  onSelect: (n: number) => void;
}

export const SurahPickerSheet = forwardRef<BottomSheet, Props>(function SurahPickerSheet(
  {surahs, selected, onSelect},
  ref,
) {
  const {t} = useTranslation();
  const snapPoints = useMemo(() => ['60%', '90%'], []);

  return (
    <BottomSheet ref={ref} snapPoints={snapPoints} index={-1} enablePanDownToClose>
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>{t('read.selectSurah')}</Text>
        <View style={styles.list}>
          <FlashList
            data={surahs}
            keyExtractor={item => String(item.number)}
            estimatedItemSize={64}
            renderItem={({item}) => (
              <Pressable
                onPress={() => onSelect(item.number)}
                style={[
                  styles.row,
                  selected === item.number && styles.rowActive,
                ]}>
                <View style={styles.numCircle}>
                  <Text style={styles.numText}>{item.number}</Text>
                </View>
                <View style={styles.namesCol}>
                  <Text style={styles.translit}>{item.name_transliteration}</Text>
                  <Text style={styles.translation}>{item.name_translation}</Text>
                </View>
                <Text style={styles.arabic}>{item.name_arabic}</Text>
              </Pressable>
            )}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {flex: 1, paddingHorizontal: 12, paddingTop: 8},
  title: {
    fontFamily: fonts.latinSemibold,
    fontSize: 16,
    color: colors.text,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  list: {flex: 1},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  rowActive: {backgroundColor: colors.primaryMuted},
  numCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {fontFamily: fonts.latin, fontSize: 13, color: colors.textMuted},
  namesCol: {flex: 1},
  translit: {fontFamily: fonts.latinSemibold, fontSize: 15, color: colors.text},
  translation: {fontFamily: fonts.latin, fontSize: 12, color: colors.textMuted},
  arabic: {
    fontFamily: fonts.arabicBold,
    fontSize: 22,
    color: colors.text,
    writingDirection: 'rtl',
  },
});
