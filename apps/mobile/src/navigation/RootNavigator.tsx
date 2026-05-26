import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {useAuthStore} from '@/stores/authStore';
import {LoadingState} from '@/components/LoadingState';
import {useWidgetSync} from '@/hooks/useWidgetSync';
import {AuthStack} from './AuthStack';
import {MainStack} from './MainStack';

export function RootNavigator() {
  const hydrated = useAuthStore(s => s.hydrated);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const hydrate = useAuthStore(s => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Keep the Android home-screen widget in sync with the user's daily words.
  // Internally gated on isAuthenticated + Android.
  useWidgetSync();

  if (!hydrated) {
    return <LoadingState />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
