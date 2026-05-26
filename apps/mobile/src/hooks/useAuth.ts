import {useAuthStore} from '@/stores/authStore';

export function useAuth() {
  return useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    hydrated: state.hydrated,
    setSession: state.setSession,
    setUser: state.setUser,
    setPreferredLanguage: state.setPreferredLanguage,
    logout: state.logout,
  }));
}
