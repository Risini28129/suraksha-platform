import { isNativeUpload, nativeUpload } from './upload-transport';
import * as SecureStore from './session-store';
import { queryClient } from './query-client';
import { useEffect } from 'react';
import { NavigationContext } from '@react-navigation/native';
import { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Session } from '@suraksha/types';
export const base = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/v1';
let token: string | null = null;
let expired = () => {};
export function setSessionExpiredHandler(handler: () => void) {
  expired = handler;
}
async function request(url: string, options: RequestInit = {}, timeout = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    if (isNativeUpload(options.body)) {
      return await nativeUpload(
        url,
        options.body,
        options.headers as Record<string, string>,
        controller.signal,
      );
    }
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (__DEV__)
      console.warn(
        'API request failed',
        url,
        error instanceof Error ? error.message : 'Unknown error',
      );
    if (controller.signal.aborted)
      throw new Error('The request timed out. Check your connection and try again.');
    throw new Error(
      'Unable to connect. Check your connection and that the local server is running.',
    );
  } finally {
    clearTimeout(timer);
  }
}
let refreshPromise: Promise<void> | null = null;
export async function saveSession(session: Session) {
  token = session.accessToken;
  await SecureStore.setItemAsync('suraksha.refresh', session.refreshToken);
}
export async function restoreSession() {
  const refreshToken = await SecureStore.getItemAsync('suraksha.refresh');
  if (!refreshToken) throw new Error('Sign in to continue');
  const res = await request(base + '/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Session expired; sign in again');
  const session: Session = await res.json();
  await saveSession(session);
  return session.user;
}
export async function signOut() {
  try {
    await api('/auth/logout', 'POST');
  } catch {
    /* Clear local credentials even when the server session has expired. */
  } finally {
    token = null;
    queryClient.clear();
    await SecureStore.deleteItemAsync('suraksha.refresh');
  }
}
export async function api<T = any>(
  path: string,
  method = 'GET',
  body?: unknown,
  retry = true,
): Promise<T> {
  const form = body instanceof FormData || isNativeUpload(body);
  const response = await request(
    base + path,
    {
      method,
      headers: {
        ...(form ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      ...(body === undefined ? {} : { body: form ? (body as BodyInit) : JSON.stringify(body) }),
    },
    form ? 60000 : 25000,
  );
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    refreshPromise ??= restoreSession()
      .then(() => {})
      .finally(() => {
        refreshPromise = null;
      });
    try {
      await refreshPromise;
    } catch (error) {
      token = null;
      queryClient.clear();
      expired();
      throw error;
    }
    return api(path, method, body, false);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const fields = error.error?.fields as Record<string, string[]> | undefined;
    const detail = fields
      ? Object.entries(fields)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('; ')
      : '';
    throw new Error(detail || error.error?.message || `Request failed (${response.status})`);
  }
  if (method !== 'GET') void queryClient.invalidateQueries();
  return response.status === 204 ? (undefined as T) : response.json();
}
export function useData<T = any>(path: string | null) {
  const navigation = useContext(NavigationContext);
  const query = useQuery<T>({
    queryKey: [path],
    queryFn: () => api<T>(path!),
    enabled: !!path,
    refetchInterval: path?.startsWith('/sos/') || path?.includes('messages') ? 5000 : false,
    retry: 1,
  });
  useEffect(
    () =>
      navigation?.addListener('focus', () => {
        if (path) void query.refetch();
      }),
    [navigation, path],
  );
  return query;
}
export async function evidenceBytes(id: string, proof: string) {
  const response = await request(base + `/evidence/${id}/content`, {
    headers: { Authorization: 'Bearer ' + token, 'X-Unlock-Proof': proof },
  });
  if (!response.ok) throw new Error('Evidence preview denied');
  return new Uint8Array(await response.arrayBuffer());
}
