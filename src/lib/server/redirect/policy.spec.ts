import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	buildDestinationUrl,
	classifyVisitor,
	eligibleDestinations,
	evaluateRules,
	matchesIp,
	normalizeIp,
	selectDestination
} from './policy';

const queryConfig = {
	forwardQuery: 'all' as const,
	forwardQueryKeys: [],
	queryConflict: 'destination_wins' as const
};

function merge(destination: string, query: string, overrides = {}) {
	return new URL(
		buildDestinationUrl(destination, new URLSearchParams(query), {
			...queryConfig,
			...overrides
		})
	);
}

describe('buildDestinationUrl', () => {
	it('preserves destination duplicates, incoming duplicates, fragment and order', () => {
		const url = merge('https://example.com/path?a=one&a=two#section%202', 'a=lost&b=1&c=2&b=3');
		expect([...url.searchParams]).toEqual([
			['a', 'one'],
			['a', 'two'],
			['b', '1'],
			['c', '2'],
			['b', '3']
		]);
		expect(url.hash).toBe('#section%202');
		expect(url.pathname).toBe('/path');
	});

	it('replaces the whole conflicting group with every incoming value', () => {
		const url = merge('https://example.com/?a=one&a=two&keep=yes#frag', 'a=1&b=2&a=3', {
			queryConflict: 'incoming_wins'
		});
		expect([...url.searchParams]).toEqual([
			['keep', 'yes'],
			['a', '1'],
			['b', '2'],
			['a', '3']
		]);
		expect(url.hash).toBe('#frag');
	});

	it('filters before resolving conflicts and uses exact case-sensitive keys', () => {
		const url = merge('https://example.com/?keep=old', 'keep=new&fbclid=a&fbclid=b&FBCLID=c', {
			forwardQuery: 'allowlist',
			forwardQueryKeys: ['fbclid'],
			queryConflict: 'incoming_wins'
		});
		expect([...url.searchParams]).toEqual([
			['keep', 'old'],
			['fbclid', 'a'],
			['fbclid', 'b']
		]);
	});

	it.each(['none', 'allowlist'])('forwards nothing for %s with no keys', (forwardQuery) => {
		expect(merge('https://example.com/?a=%20&a=2#f', 'a=changed&b=3', { forwardQuery }).href).toBe(
			'https://example.com/?a=%20&a=2#f'
		);
	});

	it('encodes decoded values exactly once, including separators, unicode and literal percent', () => {
		const url = merge(
			'https://example.com/?original=%252F',
			'fbclid=a%2Bb%2Fc%3D&space=a+b&literal=%2526&nested=https%3A%2F%2Fx.test%2F%3Fa%3D1%26b%3D2&emoji=%F0%9F%98%80'
		);
		expect(url.searchParams.get('fbclid')).toBe('a+b/c=');
		expect(url.search).toContain('fbclid=a%2Bb%2Fc%3D');
		expect(url.searchParams.get('space')).toBe('a b');
		expect(url.searchParams.get('literal')).toBe('%26');
		expect(url.searchParams.get('original')).toBe('%2F');
		expect(url.searchParams.get('nested')).toBe('https://x.test/?a=1&b=2');
		expect(url.searchParams.get('emoji')).toBe('😀');
	});

	it('uses WHATWG replacement semantics for malformed escapes without throwing', () => {
		const incoming = new URLSearchParams(
			'bad=%ZZ&partial=%&utf8=%E0%A4%A&empty=&bare&=value&encoded%3Dkey=x'
		);
		const url = new URL(
			buildDestinationUrl('https://example.com/?old=%ZZ#f', incoming, queryConfig)
		);
		expect(url.searchParams.get('old')).toBe('%ZZ');
		for (const [key, value] of incoming) expect(url.searchParams.get(key)).toBe(value);
		expect(url.searchParams.get('bad')).toBe('%ZZ');
		expect(url.searchParams.get('utf8')).toContain('�');
		expect(url.searchParams.get('bare')).toBe('');
		expect(url.searchParams.get('')).toBe('value');
	});

	it('treats reserved/prototype names as data, not configuration or routing controls', () => {
		const url = merge(
			'https://example.com/path',
			'__proto__=x&constructor=y&toString=z&redirect=https%3A%2F%2Fevil.test&preview=1'
		);
		expect(url.hostname).toBe('example.com');
		expect([...url.searchParams.keys()]).toEqual([
			'__proto__',
			'constructor',
			'toString',
			'redirect',
			'preview'
		]);
		expect(url.searchParams.get('__proto__')).toBe('x');
	});

	it('does not mutate incoming parameters or configuration', () => {
		const incoming = new URLSearchParams('a=1&a=2');
		const config = { ...queryConfig, forwardQueryKeys: ['a'] };
		buildDestinationUrl('https://example.com/?a=old', incoming, config);
		expect(incoming.toString()).toBe('a=1&a=2');
		expect(config).toEqual({ ...queryConfig, forwardQueryKeys: ['a'] });
	});

	it('rejects an invalid destination rather than inventing a base URL', () => {
		expect(() => merge('/relative', 'a=1')).toThrow(TypeError);
	});
});

const desktopChrome =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const iphone =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const android =
	'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
function browserHeaders(ua: string) {
	return new Headers({
		'user-agent': ua,
		'accept-language': 'en-US',
		'sec-fetch-mode': 'navigate'
	});
}

describe('classifyVisitor', () => {
	it('handles missing and empty UA without assuming desktop or a browser', () => {
		expect(classifyVisitor(new Headers())).toEqual({
			device: 'unknown',
			browser: 'other',
			os: null,
			isInApp: false,
			isPreview: false,
			isBot: true,
			botScore: 80
		});
		expect(classifyVisitor(browserHeaders('  ')).botScore).toBe(60);
	});

	it.each([
		[desktopChrome, 'desktop', 'chrome', 'Windows'],
		[iphone, 'mobile', 'safari', 'iOS'],
		[android, 'mobile', 'chrome', 'Android'],
		[desktopChrome + ' Edg/124.0.0.0', 'desktop', 'edge', 'Windows'],
		[desktopChrome + ' OPR/109.0.0.0', 'desktop', 'opera', 'Windows'],
		[
			android.replace('Chrome/124.0.0.0', 'SamsungBrowser/24.0 Chrome/124.0.0.0'),
			'mobile',
			'samsung',
			'Android'
		],
		[
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
			'desktop',
			'firefox',
			'Windows'
		],
		[iphone.replace('iPhone; CPU iPhone', 'iPad; CPU'), 'tablet', 'safari', 'iOS'],
		[
			'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/537.36 SamsungBrowser/2.2 TV Safari/537.36',
			'tv',
			'samsung',
			'Tizen'
		]
	])('classifies browser/device from %s', (ua, device, browser, os) => {
		expect(classifyVisitor(browserHeaders(ua))).toMatchObject({
			device,
			browser,
			os,
			isInApp: false,
			isPreview: false,
			isBot: false,
			botScore: 0
		});
	});

	it.each([
		[iphone + ' [FBAN/FBIOS;FBAV/450.0.0.0;]', 'facebook_in_app'],
		[android + ' [FB_IAB/FB4A;FBAV/450.0.0;]', 'facebook_in_app'],
		[iphone + ' Instagram 320.0.0.0', 'instagram_in_app'],
		[android.replace('Android 13;', 'Android 13; wv;'), 'chrome']
	])('marks in-app browsers separately without marking them as previews', (ua, browser) => {
		expect(classifyVisitor(browserHeaders(ua))).toMatchObject({
			browser,
			isInApp: true,
			isPreview: false,
			isBot: false
		});
	});

	it.each([
		'facebookexternalhit/1.1',
		'Facebot',
		'Twitterbot/1.0',
		'WhatsApp/2.24',
		'TelegramBot (like TwitterBot)',
		'Slackbot-LinkExpanding 1.0',
		'Discordbot/2.0',
		'LinkedInBot/1.0'
	])('recognizes only named preview hints: %s', (ua) => {
		expect(classifyVisitor(browserHeaders(ua))).toMatchObject({
			isPreview: true,
			isBot: true,
			botScore: 80
		});
	});

	it.each([
		'Googlebot/2.1',
		'Bingbot/2.0',
		'curl/8.0',
		'python-requests/2.31',
		'HeadlessChrome/124.0',
		'puppeteer'
	])('scores named automation, not preview routing: %s', (ua) => {
		expect(classifyVisitor(browserHeaders(ua))).toMatchObject({
			isPreview: false,
			isBot: true,
			botScore: 80
		});
	});

	it('does not treat generic Facebook/reviewer strings as preview names', () => {
		for (const ua of [
			'Facebook reviewer',
			'facebookexternalhitfake',
			'notTwitterbot',
			'reviewer'
		]) {
			expect(classifyVisitor(browserHeaders(ua)).isPreview).toBe(false);
		}
	});

	it('keeps missing optional browser headers a weak signal and caps scores at 100', () => {
		expect(classifyVisitor(new Headers({ 'user-agent': desktopChrome }))).toMatchObject({
			isBot: false,
			botScore: 20
		});
		expect(classifyVisitor(new Headers({ 'user-agent': 'curl/8.0' })).botScore).toBe(100);
	});

	it('does not use unrelated spoofed headers for preview classification', () => {
		const headers = browserHeaders(desktopChrome);
		headers.set('x-preview', 'true');
		headers.set('x-forwarded-for', '66.220.144.1');
		expect(classifyVisitor(headers).isPreview).toBe(false);
	});
});

describe('normalizeIp', () => {
	it.each([
		[' 192.0.2.1 ', '192.0.2.1'],
		['2001:0DB8:0000:0:0:0:0:1', '2001:db8::1'],
		['::ffff:192.0.2.1', '192.0.2.1'],
		['0:0:0:0:0:FFFF:C000:0201', '192.0.2.1'],
		['::1', '::1'],
		['::', '::']
	])('normalizes %s to %s', (input, expected) => expect(normalizeIp(input)).toBe(expected));

	it.each([
		'',
		'unknown',
		'999.0.0.1',
		'127.1',
		'0x7f000001',
		'2130706433',
		'010.0.0.1',
		'1.2.3.4:80',
		'[::1]',
		'[::1]:80',
		'fe80::1%eth0',
		'1.2.3.4/32',
		'1.2.3.4, 5.6.7.8',
		'2001:::1',
		'::ffff:999.1.1.1'
	])('rejects non-address or ambiguous input %s', (input) => expect(normalizeIp(input)).toBeNull());
});

describe('matchesIp', () => {
	it.each([
		['192.0.2.1', '192.0.2.1', true],
		['192.0.2.1', '192.0.2.2', false],
		['192.0.2.255', '192.0.2.0/24', true],
		['192.0.3.0', '192.0.2.0/24', false],
		['192.0.2.1', '192.0.2.99/24', true],
		['192.0.2.1', '0.0.0.0/0', true],
		['192.0.2.1', '192.0.2.1/32', true],
		['192.0.2.2', '192.0.2.1/32', false],
		['2001:db8::1', '2001:0db8:0:0:0:0:0:1', true],
		['2001:db8:abcd::1', '2001:db8::/32', true],
		['2001:db9::1', '2001:db8::/32', false],
		['::1', '::/0', true],
		['::1', '::1/128', true],
		['::2', '::1/128', false],
		['::ffff:192.0.2.1', '192.0.2.0/24', true],
		['192.0.2.1', '::ffff:c000:200/120', true],
		['::ffff:c000:201', '::ffff:192.0.2.1', true],
		['192.0.2.1', '::ffff:192.0.2.1/128', true],
		['192.0.2.2', '::ffff:192.0.2.1/128', false],
		['192.0.3.1', '::ffff:192.0.2.0/120', false],
		['192.0.2.1', '::ffff:0:0/96', true],
		['192.0.2.1', '::ffff:0:0/80', true],
		['::ffff:192.0.2.1', '::ffff:192.0.2.0/120', true],
		['192.0.2.1', '::/0', false],
		['::1', '0.0.0.0/0', false],
		[null, '0.0.0.0/0', false],
		['not-an-ip', '0.0.0.0/0', false]
	])('matches %s against %s: %s', (ip, rule, expected) =>
		expect(matchesIp(ip, rule)).toBe(expected)
	);

	it.each([
		'garbage',
		'192.0.2.0/33',
		'::/129',
		'::/-1',
		'::/1.5',
		'::/x',
		'::/',
		'::/64/1',
		'0x7f000001/32',
		'192.0.2.0/-1'
	])('fails safely for malformed rule %s', (rule) =>
		expect(matchesIp('192.0.2.1', rule)).toBe(false)
	);
});

const visitor = { ip: '192.0.2.1', country: 'US', device: 'desktop', browser: 'chrome' };
type Rule = Parameters<typeof evaluateRules>[0][number];
const denyRules: Rule[] = [
	{ type: 'browser', mode: 'deny', values: ['chrome'] },
	{ type: 'device', mode: 'deny', values: ['desktop'] },
	{ type: 'geo', mode: 'deny', values: ['US'] },
	{ type: 'ip', mode: 'deny', values: ['192.0.2.0/24'] }
];

describe('evaluateRules', () => {
	it('applies global blocks before campaign allow rules', () => {
		expect(
			evaluateRules([{ type: 'ip', mode: 'allow', values: ['192.0.2.1'] }], visitor, [
				'::ffff:192.0.2.0/120'
			])
		).toBe('blocked_ip');
	});

	it('always evaluates IP, geo, device, browser in that order regardless of row order', () => {
		expect(evaluateRules(denyRules, visitor)).toBe('blocked_ip');
		expect(evaluateRules([...denyRules].reverse(), visitor)).toBe('blocked_ip');
		expect(evaluateRules(denyRules.slice(0, 3), visitor)).toBe('blocked_geo');
		expect(evaluateRules(denyRules.slice(0, 2), visitor)).toBe('blocked_device');
		expect(evaluateRules(denyRules.slice(0, 1), visitor)).toBe('blocked_browser');
	});

	it.each(['ip', 'geo', 'device', 'browser'] as const)(
		'supports allow, deny and disabled %s rules',
		(type) => {
			const value = type === 'geo' ? visitor.country : visitor[type];
			expect(evaluateRules([{ type, mode: 'allow', values: [value] }], visitor)).toBeNull();
			expect(evaluateRules([{ type, mode: 'deny', values: [value] }], visitor)).toBe(
				`blocked_${type}`
			);
			expect(evaluateRules([{ type, mode: 'allow', values: ['unmatched'] }], visitor)).toBe(
				`blocked_${type}`
			);
			expect(evaluateRules([{ type, mode: 'deny', values: ['unmatched'] }], visitor)).toBeNull();
			for (const mode of ['allow', 'deny'] as const)
				expect(evaluateRules([{ type, mode, values: [] }], visitor)).toBeNull();
		}
	);

	it('denies unknown country/IP under nonempty allow rules, but not deny rules', () => {
		for (const type of ['geo', 'ip'] as const) {
			const unknown = { ...visitor, ip: null, country: null };
			expect(evaluateRules([{ type, mode: 'allow', values: ['US', '0.0.0.0/0'] }], unknown)).toBe(
				`blocked_${type}`
			);
			expect(
				evaluateRules([{ type, mode: 'deny', values: ['US', '0.0.0.0/0'] }], unknown)
			).toBeNull();
		}
	});

	it('matches country/device/browser case-insensitively and fails closed for invalid IP allow rules', () => {
		expect(evaluateRules([{ type: 'geo', mode: 'allow', values: [' us '] }], visitor)).toBeNull();
		expect(evaluateRules([{ type: 'browser', mode: 'deny', values: ['CHROME'] }], visitor)).toBe(
			'blocked_browser'
		);
		expect(evaluateRules([{ type: 'ip', mode: 'allow', values: ['invalid'] }], visitor)).toBe(
			'blocked_ip'
		);
		expect(evaluateRules([], visitor, ['invalid'])).toBeNull();
	});
});

const destination = {
	id: 'a',
	priority: 1,
	weight: 100,
	sortOrder: 0,
	isActive: true,
	startsAt: null,
	endsAt: null,
	clickCap: null,
	clickCount: 0
};

describe('eligibleDestinations', () => {
	it('uses inclusive starts, exclusive ends, active status and strict caps', () => {
		const rows = [
			{ ...destination, id: 'always' },
			{ ...destination, id: 'at-start', startsAt: new Date(100) },
			{ ...destination, id: 'future', startsAt: new Date(101) },
			{ ...destination, id: 'at-end', endsAt: new Date(100) },
			{ ...destination, id: 'before-end', endsAt: new Date(101) },
			{ ...destination, id: 'inactive', isActive: false },
			{ ...destination, id: 'below-cap', clickCap: 2, clickCount: 1 },
			{ ...destination, id: 'at-cap', clickCap: 2, clickCount: 2 },
			{ ...destination, id: 'above-cap', clickCap: 2, clickCount: 3 },
			{ ...destination, id: 'zero-cap', clickCap: 0 },
			{ ...destination, id: 'bad-date', startsAt: new Date(NaN) },
			{ ...destination, id: 'empty-window', startsAt: new Date(100), endsAt: new Date(100) }
		];
		const original = [...rows];
		const result = eligibleDestinations(rows, 100);
		expect(result.map((row) => row.id)).toEqual(['always', 'at-start', 'before-end', 'below-cap']);
		expect(result[0]).toBe(rows[0]);
		expect(rows).toEqual(original);
	});

	it('rejects non-finite time and accepts empty input', () => {
		for (const now of [NaN, Infinity, -Infinity])
			expect(eligibleDestinations([destination], now)).toEqual([]);
		expect(eligibleDestinations([], 100)).toEqual([]);
	});
});

const rotation = [
	{ ...destination, id: 'c', sortOrder: 2, priority: 1, weight: 60 },
	{ ...destination, id: 'a', sortOrder: 0, priority: 2, weight: 20 },
	{ ...destination, id: 'b', sortOrder: 1, priority: 1, weight: 20 }
];

describe('selectDestination', () => {
	afterEach(() => vi.restoreAllMocks());

	it.each(['equal', 'percentage', 'priority'] as const)(
		'handles empty and singleton %s pools',
		(strategy) => {
			expect(selectDestination([], strategy)).toBeNull();
			expect(selectDestination([destination], strategy, { random: 0.5 })).toBe(destination);
		}
	);

	it('uses 1-based round robin with deterministic sort order and ID ties', () => {
		expect(
			Array.from(
				{ length: 7 },
				(_, i) => selectDestination(rotation, 'equal', { sequence: i + 1 })?.id
			)
		).toEqual(['a', 'b', 'c', 'a', 'b', 'c', 'a']);
		const tied = rotation.map((row) => ({ ...row, sortOrder: 0 }));
		expect(selectDestination(tied, 'equal', { sequence: 1 })?.id).toBe('a');
		expect(selectDestination(tied, 'equal', { sequence: Number.MAX_SAFE_INTEGER })?.id).toBe('a');
	});

	it('selects the lowest priority, then sort order, then lexicographic ID', () => {
		expect(selectDestination(rotation, 'priority')?.id).toBe('b');
		const tied = rotation.map((row) => ({ ...row, priority: 1, sortOrder: 0 }));
		expect(selectDestination(tied, 'priority')?.id).toBe('a');
	});

	it('falls back to random when the Redis sequence is absent or invalid', () => {
		for (const sequence of [undefined, 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
			expect(selectDestination(rotation, 'equal', { sequence, random: 0.5 })?.id).toBe('b');
		}
		vi.spyOn(Math, 'random').mockReturnValue(0.99);
		expect(selectDestination(rotation, 'equal')?.id).toBe('c');
	});

	it.each(['equal', 'percentage', 'priority'] as const)(
		'honors only eligible sticky IDs for %s',
		(strategy) => {
			expect(
				selectDestination(rotation, strategy, { stickyId: 'c', sequence: 1, random: 0 })?.id
			).toBe('c');
			expect(
				selectDestination(rotation, strategy, { stickyId: 'missing', sequence: 1, random: 0 })?.id
			).toBe(strategy === 'priority' ? 'b' : 'a');
			const rows = eligibleDestinations(
				[{ ...destination, id: 'expired', endsAt: new Date(1) }, destination],
				1
			);
			expect(selectDestination(rows, strategy, { stickyId: 'expired', random: 0 })?.id).toBe('a');
		}
	);

	it('excludes zero/negative/nonfinite percentage weights, even if sticky, but not in equal/priority', () => {
		const rows = [0, -1, NaN, Infinity].map((weight, i) => ({
			...destination,
			id: String(i),
			weight
		}));
		expect(selectDestination(rows, 'percentage', { stickyId: '0', random: 0 })).toBeNull();
		expect(
			selectDestination([...rows, destination], 'percentage', { stickyId: '0', random: 0 })
		).toBe(destination);
		for (const strategy of ['equal', 'priority'] as const)
			expect(selectDestination(rows, strategy, { stickyId: '0' })).toBe(rows[0]);
	});

	it('renormalizes remaining weights after eligibility filtering', () => {
		const rows = eligibleDestinations(
			rotation.map((row) => ({ ...row, isActive: row.id !== 'c' })),
			0
		);
		expect(selectDestination(rows, 'percentage', { random: 0.499 })?.id).toBe('a');
		expect(selectDestination(rows, 'percentage', { random: 0.5 })?.id).toBe('b');
		expect(selectDestination(rows, 'percentage', { random: 1 - Number.EPSILON })?.id).toBe('b');
	});

	it('has deterministic equal and weighted distributions without statistical flakiness', () => {
		const weighted: Record<string, number> = { a: 0, b: 0, c: 0 };
		const equal: Record<string, number> = { a: 0, b: 0, c: 0 };
		const fallback: Record<string, number> = { a: 0, b: 0, c: 0 };
		for (let i = 0; i < 3000; i++) {
			weighted[selectDestination(rotation, 'percentage', { random: (i + 0.5) / 3000 })!.id]++;
			equal[selectDestination(rotation, 'equal', { sequence: i + 1 })!.id]++;
			fallback[selectDestination(rotation, 'equal', { random: (i + 0.5) / 3000 })!.id]++;
		}
		expect(weighted).toEqual({ a: 600, b: 600, c: 1800 });
		expect(equal).toEqual({ a: 1000, b: 1000, c: 1000 });
		expect(fallback).toEqual(equal);
	});

	it('does not mutate rows while ordering or selecting', () => {
		const rows = rotation.map((row) => Object.freeze({ ...row }));
		const original = [...rows];
		Object.freeze(rows);
		for (const strategy of ['equal', 'percentage', 'priority'] as const)
			selectDestination(rows, strategy, { random: 0 });
		expect(rows).toEqual(original);
	});

	it.each([-1, 1, NaN, Infinity])('rejects invalid injected random sample %s', (random) => {
		expect(() => selectDestination(rotation, 'percentage', { random })).toThrow(RangeError);
	});

	it('avoids overflow for large finite weights', () => {
		const rows = rotation.map((row) => ({ ...row, weight: Number.MAX_VALUE }));
		expect(selectDestination(rows, 'percentage', { random: 0 })?.id).toBe('a');
		expect(selectDestination(rows, 'percentage', { random: 0.5 })?.id).toBe('b');
	});
});
