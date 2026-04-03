import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_BASE } from '../api';
import { getApiBaseFallbackMessage } from '../env';
import { SessionResponse } from './session';
import { joinApiUrl } from '../url';

export async function getServerSession(): Promise<SessionResponse | null> {
  if (!API_BASE) {
    throw new Error(getApiBaseFallbackMessage());
  }

  const cookieStore = await cookies();

  const res = await fetch(joinApiUrl(API_BASE, '/auth/me'), {
    method: 'GET',
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: 'no-store',
  });

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Session check failed: HTTP ${res.status}`);
  }

  return (await res.json()) as SessionResponse;
}

export async function requireServerSession(redirectPath: string) {
  const session = await getServerSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(redirectPath)}`);
  }

  return session;
}
