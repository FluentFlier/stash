import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  createdAt?: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setAuth: (user: AuthUser, token: string) => Promise<void>;
  clear: () => Promise<void>;
};

const STORAGE_KEY = 'stash_auth';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { user: AuthUser; token: string };
        set({ user: parsed.user, token: parsed.token, hydrated: true });
        return;
      }
      set({ hydrated: true });
    } catch {
      set({ token: null, user: null, hydrated: true });
    }
  },
  setAuth: async (user, token) => {
    set({ user, token });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
  },
  clear: async () => {
    set({ user: null, token: null });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
