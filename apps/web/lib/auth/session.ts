import { ApiError, apiFetch } from '../api';

export type SessionUser = {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'mod' | 'admin';
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export type SessionResponse = {
  user: SessionUser;
};

export const sessionQueryKey = ['session'] as const;

export async function fetchSession(): Promise<SessionResponse | null> {
  try {
    return await apiFetch<SessionResponse>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}
