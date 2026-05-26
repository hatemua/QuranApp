import './global.css';
import React, {useEffect} from 'react';
import {StatusBar, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClientProvider} from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {RootNavigator} from '@/navigation/RootNavigator';
import {queryClient} from '@/lib/queryClient';
import {setupPlayer} from '@/lib/audio';
import '@/lib/i18n';
import {colors} from '@/lib/colors';

export default function App() {
  useEffect(() => {
    void setupPlayer();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1, backgroundColor: colors.background}}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <View style={{flex: 1}}>
              <RootNavigator />
              <Toast />
            </View>
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
