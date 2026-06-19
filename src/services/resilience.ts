/**
 * Tiny in-memory resilience primitives. Kept intentionally simple so the
 * demo is easy to reason about: a circuit breaker that opens after N
 * consecutive failures, and a last-known-good cache keyed by string.
 */

interface BreakerState {
  failures: number;
  openedAt?: number;
}

const BREAKER: Map<string, BreakerState> = new Map();
const CACHE: Map<string, { value: unknown; at: number }> = new Map();

const FAILURE_THRESHOLD = 2;
const OPEN_MS = 15_000;

export function isCircuitOpen(key: string): boolean {
  const s = BREAKER.get(key);
  if (!s?.openedAt) return false;
  if (Date.now() - s.openedAt > OPEN_MS) {
    BREAKER.delete(key);
    return false;
  }
  return true;
}

export function recordSuccess(key: string) {
  BREAKER.delete(key);
}

export function recordFailure(key: string) {
  const s = BREAKER.get(key) ?? { failures: 0 };
  s.failures += 1;
  if (s.failures >= FAILURE_THRESHOLD) s.openedAt = Date.now();
  BREAKER.set(key, s);
}

export function cachePut<T>(key: string, value: T) {
  CACHE.set(key, { value, at: Date.now() });
}

export function cacheGet<T>(key: string): T | undefined {
  return CACHE.get(key)?.value as T | undefined;
}

/**
 * Retry with exponential backoff. Short and bounded for demo use.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 2,
  baseMs = 120,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, baseMs * Math.pow(2, i)));
      }
    }
  }
  throw lastErr;
}

/**
 * Wrap a flaky operation with: circuit breaker + retry. If the breaker is
 * open or every attempt fails, the fallback runs and the caller is told
 * which path was taken via `usedFallback`.
 */
export async function guard<T>(
  key: string,
  primary: () => Promise<T>,
  fallback: () => T,
  opts: { attempts?: number; cache?: boolean } = {},
): Promise<{ value: T; usedFallback: boolean }> {
  if (isCircuitOpen(key)) {
    return { value: fallback(), usedFallback: true };
  }
  try {
    const value = await withRetry(primary, opts.attempts ?? 2);
    recordSuccess(key);
    if (opts.cache) cachePut(key, value);
    return { value, usedFallback: false };
  } catch {
    recordFailure(key);
    const cached = opts.cache ? cacheGet<T>(key) : undefined;
    return { value: cached ?? fallback(), usedFallback: true };
  }
}
