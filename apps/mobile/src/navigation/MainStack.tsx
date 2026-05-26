import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {MainTabs} from './MainTabs';
import {WordDetailScreen} from '@/screens/WordDetailScreen';
import {SessionScreen} from '@/screens/SessionScreen';
import {SessionSummaryScreen} from '@/screens/SessionSummaryScreen';
import type {MainStackParamList} from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen
        name="WordDetail"
        component={WordDetailScreen}
        options={{presentation: 'modal'}}
      />
      <Stack.Screen
        name="Session"
        component={SessionScreen}
        options={{presentation: 'modal', gestureEnabled: false}}
      />
      <Stack.Screen
        name="SessionSummary"
        component={SessionSummaryScreen}
        options={{presentation: 'modal', gestureEnabled: false}}
      />
    </Stack.Navigator>
  );
}
