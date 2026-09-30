import type { RequestEvent } from '@sveltejs/kit';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { normalizeIp } from './policy';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_STICKY_LENGTH = 256;
const MAX_TIMESTAMP = 8_640_000_000_000_000;

function hmac(secret: string, parts: (string | number)[]): Buffer {
	// JSON tuple framing prevents delimiter collisions; namespaces isolate uses
	// even when IP hashing and cookies fall back to the authentication secret.
	return createHmac('sha256', secret).update(JSON.stringify(parts)).digest();
}

export function hashVisitor(ip: string | null, secret: string, scope: string): string | null {
	const normalized = ip === null ? null : normalizeIp(ip);
	return normalized === null
		? null
		: hmac(secret, ['redirect:visitor:v1', scope, normalized]).toString('hex');
}

export function signSticky(
	campaignId: string,
	destinationId: string,
	expiresAt: number,
	secret: string
): string {
	if (
		!UUID.test(destinationId) ||
		!Number.isSafeInteger(expiresAt) ||
		expiresAt <= 0 ||
		expiresAt > MAX_TIMESTAMP
	) {
		throw new Error('Invalid sticky destination or expiry');
	}
	const destination = destinationId.toLowerCase();
	const signature = hmac(secret, [
		'redirect:sticky:v1',
		campaignId,
		destination,
		expiresAt
	]).toString('base64url');
	return `v1.${destination}.${expiresAt}.${signature}`;
}

/** Returns an authenticated destination ID only; callers still check destination eligibility. */
export function readSticky(
	value: string | undefined,
	campaignId: string,
	secret: string,
	now: number
): string | undefined {
	if (!value || value.length > MAX_STICKY_LENGTH || !Number.isFinite(now)) return undefined;
	const parts = value.split('.');
	if (parts.length !== 4) return undefined;
	const [version, destination, timestamp, signature] = parts;
	if (
		version !== 'v1' ||
		!UUID.test(destination) ||
		!/^[1-9]\d{0,15}$/.test(timestamp) ||
		!/^[A-Za-z0-9_-]{43}$/.test(signature)
	)
		return undefined;
	const expiresAt = Number(timestamp);
	if (!Number.isSafeInteger(expiresAt) || expiresAt > MAX_TIMESTAMP || expiresAt <= now)
		return undefined;
	const received = Buffer.from(signature, 'base64url');
	// Reject noncanonical base64 encodings as well as unequal byte lengths before comparison.
	if (received.length !== 32 || received.toString('base64url') !== signature) return undefined;
	const expected = hmac(secret, ['redirect:sticky:v1', campaignId, destination, expiresAt]);
	return timingSafeEqual(received, expected) ? destination : undefined;
}

export function getVisitorAddress(event: Pick<RequestEvent, 'getClientAddress'>): string | null {
	try {
		return normalizeIp(event.getClientAddress());
	} catch {
		return null;
	}
}

// Assigned ISO 3166-1 alpha-2 codes, not reserved/unknown/proxy codes such as
// XX, ZZ, A1, T1, EU, or user-assigned XK. The phone-country list is incomplete.
const COUNTRY_CODES = new Set(
	(
		'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ ' +
		'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
		'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP ' +
		'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ ' +
		'NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW ' +
		'SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ ' +
		'UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
	).split(' ')
);

export function getVisitorCountry(headers: Headers, trustVercelGeo: boolean): string | null {
	if (!trustVercelGeo) return null;
	const value = headers.get('x-vercel-ip-country')?.trim();
	if (!value || !/^[A-Za-z]{2}$/.test(value)) return null;
	const country = value.toUpperCase();
	return COUNTRY_CODES.has(country) ? country : null;
}
