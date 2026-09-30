import { randomBytes } from 'node:crypto';

const FALLBACK_PREFIX = 'bitfy_';
const FALLBACK_KEY_DEFAULT = 'fbclid';
const MAX_TOKEN_LENGTH = 200;

export function generateFallbackFbclid(now: number = Date.now()): string {
  const random = randomBytes(32).toString('base64url');
  const timestamp = now.toString(36);
  const token = `${FALLBACK_PREFIX}${random}_${timestamp}`;
  return token.length <= MAX_TOKEN_LENGTH
    ? token
    : token.slice(0, MAX_TOKEN_LENGTH);
}

export interface FallbackFbclidOptions {
  key?: string;
  enabled?: boolean;
  generator?: () => string;
  now?: number;
}

export interface FallbackFbclidResult {
  params: URLSearchParams;
  injected: boolean;
}


export function withFallbackFbclid(
  incoming: URLSearchParams,
  options: FallbackFbclidOptions = {}
): FallbackFbclidResult {
  const key = options.key ?? FALLBACK_KEY_DEFAULT;
  const enabled = options.enabled ?? true;

  if (!enabled) return { params: incoming, injected: false };
  if (incoming.has(key)) return { params: incoming, injected: false };

  const generator = options.generator ?? (() => generateFallbackFbclid(options.now));
  const value = generator();
  if (!value) return { params: incoming, injected: false };

  const next = new URLSearchParams(incoming);
  next.set(key, value);
  return { params: next, injected: true };
}