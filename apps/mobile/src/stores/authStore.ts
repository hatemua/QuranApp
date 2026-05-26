import {create} from 'zustand';
import {clearTokens, getTokens, saveTokens, prefs} from '@/lib/storage';
import type {AuthMeResponse, SupportedLanguage} from '@/types';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  hydrated: boolean;
  isAuthenticated: boolean;
  user: AuthMeResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrate: () => Promise<void>;
  setSession: (user: AuthMeResponse, tokens: TokenPair) => Promise<void>;
  setTokens: (tokens: TokenPair) => void;
  setUser: (user: AuthMeResponse) => void;
  setPreferredLanguage: (lang: SupportedLanguage) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  async hydrate() {
    if (get().hydrated) return;
    const tokens = await getTokens();
    if (tokens) {
      set({
        hydrated: true,
        isAuthenticated: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } else {
      set({hydrated: true});
    }
  },

  async setSession(user, tokens) {
    await saveTokens(tokens);
    prefs.setLanguage(user.preferredLanguage);
    set({
      isAuthenticated: true,
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  },

  setTokens(tokens) {
    set({accessToken: tokens.accessToken, refreshToken: tokens.refreshToken});
  },

  setUser(user) {
    set({user});
  },

  setPreferredLanguage(lang) {
    prefs.setLanguage(lang);
    const u = get().user;
    if (u) set({user: {...u, preferredLanguage: lang}});
  },

  async logout() {
    await clearTokens();
    set({isAuthenticated: false, user: null, accessToken: null, refreshToken: null});
  },
}));
