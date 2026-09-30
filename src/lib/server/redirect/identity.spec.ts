import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
	getVisitorAddress,
	getVisitorCountry,
	hashVisitor,
	readSticky,
	signSticky
} from './identity';

const secret = 'identity-test-secret-12345678901234567890';
const campaign = '7bfd6030-cfb1-42e0-abfc-ec53c887d2df';
const destination = '0ac9303e-c41d-4cb8-8c75-e529867d779e';
const otherDestination = '1724eb19-0444-43ea-8868-ce5d78be6cb6';
const now = 1_800_000_000_000;
const expires = now + 60_000;

function forgedToken(destinationId: string, expiresAt: number, campaignId = campaign) {
	const signature = createHmac('sha256', secret)
		.update(JSON.stringify(['redirect:sticky:v1', campaignId, destinationId, expiresAt]))
		.digest('base64url');
	return `v1.${destinationId}.${expiresAt}.${signature}`;
}

describe('hashVisitor', () => {
	it('returns a deterministic SHA-256 HMAC without exposing raw addresses', () => {
		const result = hashVisitor('192.0.2.1', secret, campaign);
		const expected = createHmac('sha256', secret)
			.update(JSON.stringify(['redirect:visitor:v1', campaign, '192.0.2.1']))
			.digest('hex');
		expect(result).toBe(expected);
		expect(result).toMatch(/^[0-9a-f]{64}$/);
		expect(result).not.toContain('192.0.2.1');
		expect(hashVisitor('192.0.2.1', secret, campaign)).toBe(result);
	});

	it('normalizes equivalent IPv4/mapped and IPv6 forms before hashing', () => {
		expect(hashVisitor(' ::ffff:c000:201 ', secret, campaign)).toBe(
			hashVisitor('192.0.2.1', secret, campaign)
		);
		expect(hashVisitor('2001:0DB8:0:0:0:0:0:1', secret, campaign)).toBe(
			hashVisitor('2001:db8::1', secret, campaign)
		);
	});

	it('separates keys, scopes, purposes and addresses', () => {
		const first = hashVisitor('192.0.2.1', secret, 'analytics');
		expect(hashVisitor('192.0.2.1', secret + 'other', 'analytics')).not.toBe(first);
		expect(hashVisitor('192.0.2.1', secret, 'rate-limit')).not.toBe(first);
		expect(hashVisitor('192.0.2.2', secret, 'analytics')).not.toBe(first);
		const unscoped = createHmac('sha256', secret).update('192.0.2.1').digest('hex');
		expect(first).not.toBe(unscoped);
		expect(hashVisitor('192.0.2.1', secret, 'a:b')).not.toBe(
			hashVisitor('192.0.2.1', secret, 'a\u0000b')
		);
	});

	it.each([null, '', 'not-an-ip', '1.2.3.4, 5.6.7.8', '192.0.2.1:80'])(
		'does not create a shared identity for missing or invalid IP %s',
		(ip) => {
			expect(hashVisitor(ip, secret, campaign)).toBeNull();
		}
	);
});

describe('sticky signatures', () => {
	it('round-trips a signed, bounded, cookie-safe value', () => {
		const value = signSticky(campaign, destination, expires, secret);
		expect(value.length).toBeLessThanOrEqual(256);
		expect(value).toMatch(/^[a-zA-Z0-9_.-]+$/);
		expect(value).not.toContain(secret);
		expect(readSticky(value, campaign, secret, now)).toBe(destination);
		expect(readSticky(value, campaign, secret, expires - 1)).toBe(destination);
		expect(signSticky(campaign, destination, expires, secret)).toBe(value);
	});

	it('canonicalizes UUID casing at signing', () => {
		const value = signSticky(campaign, destination.toUpperCase(), expires, secret);
		expect(readSticky(value, campaign, secret, now)).toBe(destination);
	});

	it('binds both the campaign and signing key', () => {
		const value = signSticky(campaign, destination, expires, secret);
		expect(readSticky(value, 'other-campaign', secret, now)).toBeUndefined();
		expect(readSticky(value, campaign, secret + 'other', now)).toBeUndefined();
		expect(signSticky('other-campaign', destination, expires, secret)).not.toBe(value);
	});

	it('rejects expiry at the exact boundary and afterward', () => {
		const value = signSticky(campaign, destination, expires, secret);
		expect(readSticky(value, campaign, secret, expires)).toBeUndefined();
		expect(readSticky(value, campaign, secret, expires + 1)).toBeUndefined();
		expect(
			readSticky(
				signSticky(campaign, destination, Math.floor(expires / 1000), secret),
				campaign,
				secret,
				now
			)
		).toBeUndefined();
	});

	it('rejects tampered destination, expiry, version, campaign or signature', () => {
		const value = signSticky(campaign, destination, expires, secret);
		const parts = value.split('.');
		const badSignature = (parts[3][0] === 'A' ? 'B' : 'A') + parts[3].slice(1);
		for (const tampered of [
			value.replace(destination, otherDestination),
			value.replace(String(expires), String(expires + 1)),
			value.replace('v1.', 'v2.'),
			[...parts.slice(0, 3), badSignature].join('.'),
			value.replace(destination, destination.toUpperCase())
		])
			expect(readSticky(tampered, campaign, secret, now)).toBeUndefined();
	});

	it.each([undefined, '', 'v1', '.', 'v1.a.123.signature', 'x'.repeat(257), 'x'.repeat(100_000)])(
		'fails safely for missing, malformed or oversized cookies',
		(value) => {
			expect(readSticky(value, campaign, secret, now)).toBeUndefined();
		}
	);

	it('rejects truncated, overlong, noncanonical, padded or malformed signatures', () => {
		const value = signSticky(campaign, destination, expires, secret);
		const parts = value.split('.');
		const signature = parts[3];
		const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
		const last = alphabet.indexOf(signature.at(-1)!);
		const noncanonical = signature.slice(0, -1) + alphabet[last + 1];
		expect(Buffer.from(noncanonical, 'base64url')).toEqual(Buffer.from(signature, 'base64url'));
		for (const replacement of [
			signature.slice(1),
			signature + 'A',
			signature + '=',
			'*'.repeat(43),
			noncanonical
		]) {
			expect(
				readSticky([...parts.slice(0, 3), replacement].join('.'), campaign, secret, now)
			).toBeUndefined();
		}
		expect(readSticky(value + '.extra', campaign, secret, now)).toBeUndefined();
	});

	it('validates the destination even with a correctly signed payload', () => {
		for (const id of [
			'not-a-uuid',
			'https://example.test',
			destination.replace('-4cb8-', '-0cb8-'),
			destination.replace('-8c75-', '-0c75-')
		]) {
			expect(readSticky(forgedToken(id, expires), campaign, secret, now)).toBeUndefined();
			expect(() => signSticky(campaign, id, expires, secret)).toThrow(
				'Invalid sticky destination or expiry'
			);
		}
	});

	it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 8_640_000_000_000_001])(
		'rejects invalid millisecond expiry %s',
		(timestamp) => {
			expect(() => signSticky(campaign, destination, timestamp, secret)).toThrow(
				'Invalid sticky destination or expiry'
			);
			expect(
				readSticky(forgedToken(destination, timestamp), campaign, secret, now)
			).toBeUndefined();
		}
	);

	it('rejects alternative numeric encodings of a valid timestamp', () => {
		const value = signSticky(campaign, destination, expires, secret);
		for (const timestamp of [
			`0${expires}`,
			`${expires}.0`,
			`+${expires}`,
			`${expires}e0`,
			'Infinity'
		]) {
			expect(
				readSticky(value.replace(String(expires), timestamp), campaign, secret, now)
			).toBeUndefined();
		}
	});

	it.each([NaN, Infinity, -Infinity])('rejects invalid current time %s', (time) => {
		expect(
			readSticky(signSticky(campaign, destination, expires, secret), campaign, secret, time)
		).toBeUndefined();
	});

	it('does not accept a visitor-namespace HMAC as a sticky signature', () => {
		const signature = createHmac('sha256', secret)
			.update(JSON.stringify(['redirect:visitor:v1', campaign, destination, expires]))
			.digest('base64url');
		expect(
			readSticky(`v1.${destination}.${expires}.${signature}`, campaign, secret, now)
		).toBeUndefined();
	});
});

describe('getVisitorAddress', () => {
	it('uses the adapter address and preserves its method receiver', () => {
		const event = {
			address: '::ffff:192.0.2.1',
			getClientAddress() {
				return this.address;
			},
			request: new Request('https://example.test', {
				headers: { 'x-forwarded-for': '198.51.100.1' }
			})
		};
		expect(getVisitorAddress(event)).toBe('192.0.2.1');
	});

	it('returns null on adapter exceptions without falling back to spoofed headers', () => {
		const getClientAddress = vi.fn(() => {
			throw new Error('adapter unavailable');
		});
		const event = {
			getClientAddress,
			request: new Request('https://example.test', {
				headers: {
					'x-forwarded-for': '192.0.2.1',
					'x-real-ip': '192.0.2.2',
					forwarded: 'for=192.0.2.3'
				}
			})
		};
		expect(getVisitorAddress(event)).toBeNull();
		expect(getClientAddress).toHaveBeenCalledOnce();
	});

	it.each(['', 'unknown', '192.0.2.1, 192.0.2.2', '192.0.2.1:443', '[::1]'])(
		'rejects invalid adapter address %s',
		(address) => {
			expect(getVisitorAddress({ getClientAddress: () => address })).toBeNull();
		}
	);
});

describe('getVisitorCountry', () => {
	it.each(['us', ' GB ', 'ID', 'AX', 'BQ', 'CW', 'SS', 'SX', 'NA'])(
		'normalizes assigned platform country %s',
		(country) => {
			expect(getVisitorCountry(new Headers({ 'x-vercel-ip-country': country }), true)).toBe(
				country.trim().toUpperCase()
			);
		}
	);

	it('ignores even plausible Vercel country headers outside the trusted deployment', () => {
		expect(getVisitorCountry(new Headers({ 'x-vercel-ip-country': 'US' }), false)).toBeNull();
	});

	it.each([
		'',
		'XX',
		'ZZ',
		'AA',
		'XK',
		'EU',
		'AP',
		'UK',
		'UN',
		'OO',
		'A1',
		'T1',
		'USA',
		'US,GB',
		'US GB',
		'U1',
		'éé',
		'ß'
	])('rejects unknown, reserved and malformed country %s', (country) => {
		expect(getVisitorCountry(new Headers({ 'x-vercel-ip-country': country }), true)).toBeNull();
	});

	it('does not consult alternative geo or forwarding headers', () => {
		const headers = new Headers({
			'cf-ipcountry': 'US',
			'x-country': 'GB',
			'x-forwarded-for': '192.0.2.1'
		});
		expect(getVisitorCountry(headers, true)).toBeNull();
		expect(getVisitorCountry(new Headers(), true)).toBeNull();
		headers.set('x-vercel-ip-country', 'ZZ');
		expect(getVisitorCountry(headers, true)).toBeNull();
	});
});
