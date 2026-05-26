import {create} from 'zustand';
import {prefs} from '@/lib/storage';

interface SettingsState {
  dailyGoal: number;
  notificationsEnabled: boolean;
  setDailyGoal: (n: number) => void;
  setNotificationsEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>(set => ({
  dailyGoal: prefs.getDailyGoal(),
  notificationsEnabled: prefs.getNotificationsEnabled(),
  setDailyGoal(n) {
    prefs.setDailyGoal(n);
    set({dailyGoal: n});
  },
  setNotificationsEnabled(v) {
    prefs.setNotificationsEnabled(v);
    set({notificationsEnabled: v});
  },
}));
