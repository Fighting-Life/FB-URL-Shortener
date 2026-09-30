/** Slugs that can never be used by campaigns (they collide with app routes). */
export const RESERVED_SLUGS = new Set([
  '_app',
  '2fa',
  'admin',
  'api',
  'about',
  'app',
  'blog',
  'contact',
  'dashboard',
  'dmca',
  'docs',
  'faq',
  'favicon.ico',
  'forgot-password',
  'go',
  'health',
  'login',
  'logout',
  'otp-verification',
  'payout-rates',
  'privacy',
  'register',
  'report',
  'reset-password',
  'robots.txt',
  's',
  'signin',
  'signout',
  'signup',
  'sitemap.xml',
  'static',
  'terms'
]);

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/l/I

/** Cryptographically random, URL-safe, unambiguous slug. */
export function generateSlug(length = 7): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export const SLUG_PATTERN = /^[a-zA-Z0-9-_]{3,64}$/;

export function isValidCustomSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug.toLowerCase());
}
