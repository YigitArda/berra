'use client';

import { create } from 'zustand';

type AppState = {
  unreadCount: number;
  setUnreadCount: (value: number) => void;
  toastMessage: string | null;
  setToastMessage: (value: string | null) => void;
  clearToast: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (value) => set({ unreadCount: value }),
  toastMessage: null,
  setToastMessage: (value) => set({ toastMessage: value }),
  clearToast: () => set({ toastMessage: null }),
}));
