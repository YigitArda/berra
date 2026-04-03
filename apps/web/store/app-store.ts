'use client';

import { create } from 'zustand';

type ThemeMode = 'dark' | 'light';

type AppState = {
  localBadgeCount: number;
  setLocalBadgeCount: (value: number) => void;
  toastMessage: string | null;
  setToastMessage: (value: string | null) => void;
  clearToast: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'berra_theme';

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(theme);
}

function readTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

export const useAppStore = create<AppState>((set, get) => ({
  localBadgeCount: 0,
  setLocalBadgeCount: (value) => set({ localBadgeCount: value }),
  toastMessage: null,
  setToastMessage: (value) => set({ toastMessage: value }),
  clearToast: () => set({ toastMessage: null }),
  theme: readTheme(),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
