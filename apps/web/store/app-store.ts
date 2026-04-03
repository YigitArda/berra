'use client';

import { create } from 'zustand';

type AppState = {
  unreadCount: number;
  setUnreadCount: (value: number) => void;
  incrementUnread: () => void;
  toastMessage: string | null;
  setToastMessage: (value: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (value) => set({ unreadCount: value }),
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  toastMessage: null,
  setToastMessage: (value) => set({ toastMessage: value }),
}));
