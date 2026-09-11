import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Where the API lives depends on how the app is being run:
 *
 *   Android emulator   10.0.2.2      (the emulator's alias for the host)
 *   adb reverse / iOS  localhost     (`adb reverse tcp:4000 tcp:4000`)
 *   physical device    the host's LAN IP, e.g. 192.168.0.100
 *
 * Rather than making that a build-time guess that breaks when the setup
 * changes, the candidates are tried in order and the first one that answers is
 * remembered for the rest of the session.
 */
const PORT = process.env.EXPO_PUBLIC_API_PORT || '4000';
const PATH = '/api/v1';

function candidateHosts(): string[] {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  const lan = process.env.EXPO_PUBLIC_API_HOST; // e.g. 192.168.0.100

  const list = [
    explicit,
    Platform.OS === 'android' ? `http://10.0.2.2:${PORT}${PATH}` : null,
    `http://localhost:${PORT}${PATH}`,
    lan ? `http://${lan}:${PORT}${PATH}` : null,
  ].filter(Boolean) as string[];

  // Keep order, drop duplicates.
  return Array.from(new Set(list));
}

const CANDIDATES = candidateHosts();

/** The base that last worked; tried first on every subsequent call. */
let activeBase: string | null = null;

export function getApiBase(): string {
  return activeBase || CANDIDATES[0];
}

/** Lets a screen show which host it is talking to when things go wrong. */
export function getApiCandidates(): string[] {
  return CANDIDATES;
}

function isNetworkError(err: any) {
  const m = String(err?.message || err);
  return /network request failed|failed to fetch|timed out|abort/i.test(m);
}

async function attempt(base: string, endpoint: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${base}${endpoint}`, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function mobileApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data: T; message?: string }> {
  const token = await AsyncStorage.getItem('user_access_token');

  // Announcing a JSON body when there is none makes Fastify reject the request
  // outright — that is what made submitting a finished exam fail.
  const headers: HeadersInit = {
    ...(options.body !== undefined && options.body !== null
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Try the known-good base first, then the rest.
  const bases = activeBase
    ? [activeBase, ...CANDIDATES.filter((b) => b !== activeBase)]
    : CANDIDATES;

  let lastError: any = null;

  for (const base of bases) {
    try {
      const res = await attempt(base, endpoint, { ...options, headers }, 12000);

      // Reaching the server at all makes this base the good one, even if the
      // request itself was rejected — that is an API answer, not a bad host.
      activeBase = base;

      return await res.json();
    } catch (error: any) {
      lastError = error;

      // Only a connectivity failure is worth trying the next host for.
      if (!isNetworkError(error)) break;
    }
  }

  const tried = bases.join(', ');
  console.error(`[MobileAPI] ${endpoint} unreachable. Tried: ${tried}`, lastError);

  return {
    success: false,
    data: null as any,
    message:
      lastError && isNetworkError(lastError)
        ? 'No internet connection. Please check your network and try again.'
        : lastError?.message || 'Network connection issue',
  };
}
