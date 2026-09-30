import { randomBytes } from 'node:crypto';
import { tokenGenerator } from './token';

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

  // const generator = options.generator ?? (() => generateFallbackFbclid(options.now));
  // 
  const generator = options.generator ?? (() => tokenGenerator.generateToken({
    click: true,
    aem: generateAlphanumeric(22),
    app_id: generateNumeric(16),
    timestamp: Date.now()
  }));

  const value = generator();
  if (!value) return { params: incoming, injected: false };

  const next = new URLSearchParams(incoming);
  next.set(key, value);
  return { params: next, injected: true };
}


function generateAlphanumeric(length: number = 22): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

function generateNumeric(length: number = 16): string {
  const chars = '0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}