'use client';

import { create } from 'zustand';

type AppState = {
  localBadgeCount: number;
  setLocalBadgeCount: (value: number) => void;
  toastMessage: string | null;
  setToastMessage: (value: string | null) => void;
  clearToast: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  localBadgeCount: 0,
  setLocalBadgeCount: (value) => set({ localBadgeCount: value }),
  toastMessage: null,
  setToastMessage: (value) => set({ toastMessage: value }),
  clearToast: () => set({ toastMessage: null }),
}));
