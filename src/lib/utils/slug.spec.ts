import { describe, expect, it } from 'vitest';
import { generateSlug, isValidCustomSlug, SLUG_PATTERN } from './slug';

describe('generateSlug', () => {
  it('creates unambiguous slugs that pass validation', () => {
    for (let i = 0; i < 200; i++) {
      const slug = generateSlug();
      expect(slug).toHaveLength(7);
      expect(slug).toMatch(SLUG_PATTERN);
      expect(slug).not.toMatch(/[0O1lI]/);
    }
  });
});

describe('isValidCustomSlug', () => {
  it.each(['app', 'API', 'signin', '2fa', '_app', 'otp-verification'])(
    'rejects reserved route %s',
    (slug) => {
      expect(isValidCustomSlug(slug)).toBe(false);
    }
  );

  it('accepts normal custom slugs', () => {
    expect(isValidCustomSlug('promo-sept')).toBe(true);
  });
});
