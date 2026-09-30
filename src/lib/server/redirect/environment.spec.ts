import { beforeEach, describe, expect, it, vi } from 'vitest';

const dynamic = vi.hoisted(() => ({
	private: {} as Record<string, string | undefined>,
	public: {} as Record<string, string | undefined>
}));
vi.mock('$env/dynamic/private', () => ({ env: dynamic.private }));
vi.mock('$env/dynamic/public', () => ({ env: dynamic.public }));

import { getRedirectEnvironment, parseRedirectEnvironment } from './environment';

const core = {
	DATABASE_URL: 'postgresql://user:database-password@db.example.test/app',
	BETTER_AUTH_SECRET: 'auth-secret-for-tests-only-1234567890'
};

function errorFor(values: Record<string, string | undefined>): Error {
	try {
		parseRedirectEnvironment(values);
	} catch (error) {
		expect(error).toBeInstanceOf(Error);
		return error as Error;
	}
	throw new Error('Expected invalid environment');
}

describe('parseRedirectEnvironment', () => {
	it('requires valid core configuration and supplies safe defaults', () => {
		expect(parseRedirectEnvironment(core)).toEqual({
			secret: core.BETTER_AUTH_SECRET,
			rateLimit: 120,
			trustVercelGeo: false,
			platformHosts: []
		});
		expect(errorFor({}).message).toBe(
			'Invalid redirect environment: BETTER_AUTH_SECRET, DATABASE_URL'
		);
	});

	it.each([
		'postgres://user:pass@db.example.test/app',
		'postgresql://db.example.test/app?sslmode=require'
	])('accepts PostgreSQL URL %s', (DATABASE_URL) => {
		expect(parseRedirectEnvironment({ ...core, DATABASE_URL }).rateLimit).toBe(120);
	});

	it.each([
		undefined,
		'',
		'not-a-url',
		'https://db.example.test/app',
		'mysql://db.example.test/app',
		'postgresql:///app'
	])('rejects absent or invalid DATABASE_URL %s', (DATABASE_URL) => {
		expect(errorFor({ ...core, DATABASE_URL }).message).toBe(
			'Invalid redirect environment: DATABASE_URL'
		);
	});

	it.each([undefined, '', 'short', 'x'.repeat(31), ' '.repeat(32)])(
		'rejects absent or weak authentication secrets',
		(BETTER_AUTH_SECRET) => {
			expect(errorFor({ ...core, BETTER_AUTH_SECRET }).message).toBe(
				'Invalid redirect environment: BETTER_AUTH_SECRET'
			);
		}
	);

	it('uses a dedicated hashing secret when supplied, without trimming key material', () => {
		const IP_HASH_SECRET = ' dedicated-hash-secret-123456789012345 ';
		expect(parseRedirectEnvironment({ ...core, IP_HASH_SECRET }).secret).toBe(IP_HASH_SECRET);
		expect(errorFor({ ...core, IP_HASH_SECRET: 'too-short' }).message).toBe(
			'Invalid redirect environment: IP_HASH_SECRET'
		);
		expect(errorFor({ DATABASE_URL: core.DATABASE_URL, IP_HASH_SECRET }).message).toBe(
			'Invalid redirect environment: BETTER_AUTH_SECRET'
		);
	});

	it('treats blank optional deployment settings as unset', () => {
		expect(
			parseRedirectEnvironment({
				...core,
				IP_HASH_SECRET: '',
				UPSTASH_REDIS_REST_URL: ' ',
				UPSTASH_REDIS_REST_TOKEN: '',
				REDIRECT_RATE_LIMIT: '',
				PUBLIC_SITE_URL: '',
				BETTER_AUTH_URL: ' ',
				ORIGIN: ''
			})
		).toEqual(parseRedirectEnvironment(core));
	});

	it('requires Redis URL/token together', () => {
		for (const partial of [
			{ UPSTASH_REDIS_REST_URL: 'https://redis.example.test' },
			{ UPSTASH_REDIS_REST_TOKEN: 'redis-token' }
		]) {
			expect(errorFor({ ...core, ...partial }).message).toBe(
				'Invalid redirect environment: UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL'
			);
		}
		expect(
			parseRedirectEnvironment({
				...core,
				UPSTASH_REDIS_REST_URL: 'https://redis.example.test',
				UPSTASH_REDIS_REST_TOKEN: 'redis-token'
			})
		).toMatchObject({ redisUrl: 'https://redis.example.test', redisToken: 'redis-token' });
	});

	it.each([
		'http://redis.example.test',
		'redis://redis.example.test',
		'https://user:secret@redis.example.test',
		'https://redis.example.test/#secret',
		'not a valid URL'
	])('rejects unsafe or malformed Redis endpoint %s', (UPSTASH_REDIS_REST_URL) => {
		expect(
			errorFor({ ...core, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN: 'private-token' })
				.message
		).toBe('Invalid redirect environment: UPSTASH_REDIS_REST_URL');
	});

	it.each(['1', '120', '10000'])('accepts integral rate limit %s', (REDIRECT_RATE_LIMIT) => {
		expect(parseRedirectEnvironment({ ...core, REDIRECT_RATE_LIMIT }).rateLimit).toBe(
			Number(REDIRECT_RATE_LIMIT)
		);
	});

	it.each([
		'0',
		'10001',
		'-1',
		'1.5',
		'1e2',
		'Infinity',
		'NaN',
		'120abc',
		' 120 ',
		'9007199254740993'
	])('rejects invalid rate limit %s', (REDIRECT_RATE_LIMIT) => {
		expect(errorFor({ ...core, REDIRECT_RATE_LIMIT }).message).toBe(
			'Invalid redirect environment: REDIRECT_RATE_LIMIT'
		);
	});

	it.each([undefined, '', '0', 'true', 'yes', ' 1'])(
		'does not trust Vercel geo for flag %s',
		(VERCEL) => {
			expect(parseRedirectEnvironment({ ...core, VERCEL }).trustVercelGeo).toBe(false);
		}
	);

	it('trusts geo only when VERCEL is exactly 1', () => {
		expect(parseRedirectEnvironment({ ...core, VERCEL: '1' }).trustVercelGeo).toBe(true);
	});

	it('normalizes and deduplicates platform hostnames independently of port, path and scheme', () => {
		expect(
			parseRedirectEnvironment({
				...core,
				PUBLIC_SITE_URL: 'https://EXAMPLE.test.:443/some/path?x=1',
				BETTER_AUTH_URL: 'http://example.test:5000/api/auth',
				ORIGIN: 'http://LOCALHOST:5000/'
			}).platformHosts
		).toEqual(['example.test', 'localhost']);
		expect(
			parseRedirectEnvironment({ ...core, ORIGIN: 'http://[::1]:5000' }).platformHosts
		).toEqual(['[::1]']);
	});

	it.each(['PUBLIC_SITE_URL', 'BETTER_AUTH_URL', 'ORIGIN'])(
		'validates optional HTTP(S) setting %s',
		(field) => {
			for (const value of ['javascript:alert(1)', 'ftp://example.test', '/relative', 'bad-url']) {
				expect(errorFor({ ...core, [field]: value }).message).toBe(
					`Invalid redirect environment: ${field}`
				);
			}
		}
	);

	it('exposes only field names, with no Zod issues, cause, URLs or secret values', () => {
		const values = {
			DATABASE_URL: 'mysql://private-user:private-password@private-host/db',
			BETTER_AUTH_SECRET: 'sensitive-auth-value',
			IP_HASH_SECRET: 'sensitive-hash-value',
			UPSTASH_REDIS_REST_URL: 'malformed-private-redis-url',
			UPSTASH_REDIS_REST_TOKEN: 'sensitive-token',
			PUBLIC_SITE_URL: 'malformed-private-public-url'
		};
		const error = errorFor(values);
		expect(error.message).toBe(
			'Invalid redirect environment: BETTER_AUTH_SECRET, DATABASE_URL, IP_HASH_SECRET, PUBLIC_SITE_URL, UPSTASH_REDIS_REST_URL'
		);
		expect(error).not.toHaveProperty('issues');
		expect(error).not.toHaveProperty('cause');
		for (const value of Object.values(values)) {
			expect(error.stack).not.toContain(value);
			expect(String(error)).not.toContain(value);
		}
	});

	it('does not return database/auth configuration or mutate caller values', () => {
		const values = Object.freeze({ ...core, IGNORED_SECRET: 'unrelated' });
		const result = parseRedirectEnvironment(values);
		expect(result).not.toHaveProperty('DATABASE_URL');
		expect(result).not.toHaveProperty('BETTER_AUTH_SECRET');
		expect(result).not.toHaveProperty('IGNORED_SECRET');
		expect(values).toEqual({ ...core, IGNORED_SECRET: 'unrelated' });
	});
});

describe('getRedirectEnvironment', () => {
	beforeEach(() => {
		for (const values of [dynamic.private, dynamic.public]) {
			for (const key of Object.keys(values)) delete values[key];
		}
	});

	it('can import with missing environment and validates only when called', async () => {
		vi.resetModules();
		const module = await import('./environment');
		expect(() => module.getRedirectEnvironment()).toThrow('BETTER_AUTH_SECRET, DATABASE_URL');
	});

	it('combines private settings with PUBLIC_SITE_URL from the public environment', () => {
		Object.assign(dynamic.private, core, {
			PUBLIC_SITE_URL: 'https://wrong.example.test',
			VERCEL: '1'
		});
		dynamic.public.PUBLIC_SITE_URL = 'https://PUBLIC.example.test.';
		expect(getRedirectEnvironment()).toMatchObject({
			platformHosts: ['public.example.test'],
			trustVercelGeo: true
		});
	});

	it('does not cache environment values or validation failures', () => {
		expect(() => getRedirectEnvironment()).toThrow();
		Object.assign(dynamic.private, core);
		expect(getRedirectEnvironment().rateLimit).toBe(120);
		dynamic.private.REDIRECT_RATE_LIMIT = '42';
		expect(getRedirectEnvironment().rateLimit).toBe(42);
	});
});
