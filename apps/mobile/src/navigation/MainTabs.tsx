import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {BookOpen, Sunrise, User} from 'lucide-react-native';
import {useTranslation} from 'react-i18next';
import {ReadScreen} from '@/screens/ReadScreen';
import {TodayScreen} from '@/screens/TodayScreen';
import {ProfileScreen} from '@/screens/ProfileScreen';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import type {MainTabParamList} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const {t} = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: {fontFamily: fonts.latin, fontSize: 11},
      }}>
      <Tab.Screen
        name="Read"
        component={ReadScreen}
        options={{
          tabBarLabel: t('tabs.read'),
          tabBarIcon: ({color, size}) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarLabel: t('tabs.today'),
          tabBarIcon: ({color, size}) => <Sunrise color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({color, size}) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
