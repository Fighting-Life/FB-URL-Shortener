import { describe, expect, it } from 'vitest';
import { campaignFormSchema, campaignListFilterSchema, isPublicHttpUrl } from './campaign';

const base = {
  name: 'Promo September',
  destinations: [{ url: 'https://destination-url-01.com/' }]
};

function issues(input: unknown) {
  const result = campaignFormSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

describe('isPublicHttpUrl', () => {
  it.each([
    'https://destination-url-01.com/?ref=abc',
    'http://example.co.id/path',
    'https://[2606:4700::1111]/'
  ])('accepts %s', (url) => {
    expect(isPublicHttpUrl(url)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'ftp://example.com',
    'https://localhost:5173',
    'http://127.0.0.1',
    'http://2130706433', // 127.0.0.1 as a decimal integer
    'http://0x7f.1',
    'http://192.168.1.10',
    'http://10.0.0.1',
    'http://172.20.0.1',
    'http://169.254.169.254/latest/meta-data',
    'http://[::1]/',
    'http://[fd00::1]/',
    'https://user:pass@example.com',
    'https://printer.local',
    'https://intranet'
  ])('rejects %s', (url) => {
    expect(isPublicHttpUrl(url)).toBe(false);
  });
});

describe('campaignFormSchema', () => {
  it('fills defaults for a minimal campaign', () => {
    const parsed = campaignFormSchema.parse(base);
    expect(parsed).toMatchObject({
      slug: '',
      status: 'draft',
      rotationStrategy: 'equal',
      delayMs: 0,
      forwardQuery: 'all',
      referrerMode: 'passthrough',
      botAction: 'log_only',
      rules: { geo: { mode: 'deny', values: [] } },
      tags: []
    });
    expect(parsed.destinations[0]).toMatchObject({ weight: 100, priority: 1, isActive: true });
  });

  it('requires at least one destination', () => {
    expect(issues({ ...base, destinations: [] })).toContain('destinations');
  });

  it('rejects reserved and malformed slugs', () => {
    expect(issues({ ...base, slug: 'app' })).toContain('slug');
    expect(issues({ ...base, slug: 'signin' })).toContain('slug');
    expect(issues({ ...base, slug: 'has space' })).toContain('slug');
    expect(issues({ ...base, slug: 'promo-sept_01' })).toEqual([]);
  });

  it('requires active percentages to total 100', () => {
    const destinations = [
      { url: 'https://a.example.com', weight: 60 },
      { url: 'https://b.example.com', weight: 30 },
      { url: 'https://c.example.com', weight: 90, isActive: false }
    ];
    expect(issues({ ...base, rotationStrategy: 'percentage', destinations })).toContain(
      'destinations'
    );

    destinations[1].weight = 40;
    expect(issues({ ...base, rotationStrategy: 'percentage', destinations })).toEqual([]);
  });

  it('requires an active destination when the campaign is active', () => {
    expect(
      issues({
        ...base,
        status: 'active',
        destinations: [{ url: 'https://a.example.com', isActive: false }]
      })
    ).toContain('destinations');
  });

  it('requires keys for allowlist query forwarding', () => {
    expect(issues({ ...base, forwardQuery: 'allowlist' })).toContain('forwardQueryKeys');
    expect(issues({ ...base, forwardQuery: 'allowlist', forwardQueryKeys: ['fbclid'] })).toEqual(
      []
    );
  });

  it('validates destination schedule order', () => {
    expect(
      issues({
        ...base,
        destinations: [
          {
            url: 'https://a.example.com',
            startsAt: new Date('2026-10-02'),
            endsAt: new Date('2026-10-01')
          }
        ]
      })
    ).toContain('destinations.0.endsAt');
  });

  it('validates rule values', () => {
    expect(
      issues({
        ...base,
        rules: {
          geo: { mode: 'allow', values: ['ID', 'MY'] },
          ip: { values: ['203.0.113.7', '198.51.100.0/24', '2001:db8::/32'] },
          device: { values: ['desktop'] },
          browser: { values: ['facebook_in_app'] }
        }
      })
    ).toEqual([]);

    expect(issues({ ...base, rules: { geo: { values: ['id'] } } })).toContain(
      'rules.geo.values.0'
    );
    expect(issues({ ...base, rules: { ip: { values: ['999.1.1.1'] } } })).toContain(
      'rules.ip.values.0'
    );
    expect(issues({ ...base, rules: { device: { values: ['phone'] } } })).toContain(
      'rules.device.values.0'
    );
  });

  it('validates analytics tag IDs per provider and rejects duplicates', () => {
    const tags = [
      { provider: 'gtag', tagId: 'G-AB12CD34EF' },
      { provider: 'gtag', tagId: 'GTM-5XK2Q9P' },
      { provider: 'fb_pixel', tagId: '123456789012345' },
      { provider: 'tiktok_pixel', tagId: 'C4ABCDEFGHIJKLMNOPQR' },
      { provider: 'histats', tagId: '4912345' }
    ];
    expect(issues({ ...base, tags })).toEqual([]);

    expect(issues({ ...base, tags: [{ provider: 'fb_pixel', tagId: '<script>' }] })).toContain(
      'tags.0.tagId'
    );
    expect(issues({ ...base, tags: [{ provider: 'gtag', tagId: 'UA-1234' }] })).toContain(
      'tags.0.tagId'
    );
    expect(issues({ ...base, tags: [tags[2], tags[2]] })).toContain('tags.1.tagId');
  });
});

describe('campaignListFilterSchema', () => {
  it('falls back to safe defaults for bad query params', () => {
    expect(
      campaignListFilterSchema.parse({
        page: '-3',
        pageSize: '1000',
        status: 'nope',
        sort: 'drop table',
        scope: 'everyone'
      })
    ).toEqual({
      q: '',
      status: undefined,
      strategy: undefined,
      sort: 'created_desc',
      page: 1,
      pageSize: 20,
      scope: 'mine'
    });
  });

  it('parses valid query params', () => {
    expect(
      campaignListFilterSchema.parse({ q: ' promo ', page: '2', pageSize: '50', status: 'active' })
    ).toMatchObject({ q: 'promo', page: 2, pageSize: 50, status: 'active' });
  });
});
