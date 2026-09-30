import {
	isPublicHttpUrl,
	MAX_DELAY_MS,
	TAG_ID_PATTERNS,
	type TagProvider
} from '$lib/schemas/campaign';
import { randomBytes } from 'node:crypto';

export interface PageConfig {
	name: string;
	ogTitle: string | null;
	ogDescription: string | null;
	ogImage: string | null;
}

export interface InterstitialConfig extends PageConfig {
	delayMs: number;
}

export interface PageTag {
	provider: TagProvider;
	tagId: string;
	isActive: boolean;
}

export interface InterstitialOptions {
	/** Pass false when request-level GPC/DNT or another privacy policy disables tracking. */
	trackingEnabled?: boolean;
}

const BASE_CSP =
	"default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'";

export function pageHeaders(): Headers {
	return new Headers({
		'Content-Type': 'text/html; charset=utf-8',
		'Cache-Control': 'no-store',
		'X-Robots-Tag': 'noindex, nofollow',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'no-referrer',
		'X-Frame-Options': 'DENY',
		'Content-Security-Policy': BASE_CSP
	});
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => {
		return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!;
	});
}

function inlineJson(value: unknown): string {
	return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
		return `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`;
	});
}

function publicUrl(value: string | null, maxLength = 2048): string | null {
	if (typeof value !== 'string' || value.length > maxLength || !isPublicHttpUrl(value)) {
		return null;
	}
	const normalized = new URL(value).href;
	return normalized.length <= maxLength ? normalized : null;
}

function metadata(config: PageConfig, canonicalUrl?: string): string {
	const title = escapeHtml(config.ogTitle ?? config.name);
	const image = publicUrl(config.ogImage);
	const canonical = publicUrl(canonicalUrl ?? null);
	return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>${title}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
${config.ogDescription !== null ? `<meta name="description" content="${escapeHtml(config.ogDescription)}">\n<meta property="og:description" content="${escapeHtml(config.ogDescription)}">` : ''}
${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">\n<meta property="og:url" content="${escapeHtml(canonical)}">` : ''}`;
}

function campaign(config: PageConfig): string {
	return `<h1>${escapeHtml(config.ogTitle ?? config.name)}</h1>
<p>Campaign: ${escapeHtml(config.name)}</p>
${config.ogDescription !== null ? `<p>${escapeHtml(config.ogDescription)}</p>` : ''}`;
}

function destinationLink(url: string, label?: string): string {
	return `<a href="${escapeHtml(url)}" rel="noreferrer noopener">${escapeHtml(label ?? url)}</a>`;
}

/** No destination requests, analytics, automatic navigation, or application/session markup. */
export function renderPreview(config: PageConfig, urls: string[], canonicalUrl: string): Response {
	const destinations = [
		...new Set(urls.map((url) => publicUrl(url)).filter((url) => url !== null))
	];
	return new Response(
		`<!doctype html>
<html lang="en"><head>${metadata(config, canonicalUrl)}</head><body><main>
${campaign(config)}
<p>This campaign links to the destinations below. Campaign metadata is provided by its owner; destination content has not been verified.</p>
<h2>Destinations</h2>
${destinations.length ? `<ul>${destinations.map((url) => `<li><strong>${escapeHtml(new URL(url).host)}</strong> — ${destinationLink(url)}</li>`).join('\n')}</ul>` : '<p>No valid public destinations are available.</p>'}
</main></body></html>`,
		{ headers: pageHeaders() }
	);
}

function validTags(tags: PageTag[]): PageTag[] {
	const seen = new Set<string>();
	return tags.flatMap((tag) => {
		if (
			!tag ||
			tag.isActive !== true ||
			!Object.hasOwn(TAG_ID_PATTERNS, tag.provider) ||
			typeof tag.tagId !== 'string'
		)
			return [];
		const tagId = tag.tagId.trim();
		if (!TAG_ID_PATTERNS[tag.provider].pattern.test(tagId)) return [];
		// The schema also permits Ads/Floodlight/Google tag IDs; these templates support GA4/GTM only.
		if (tag.provider === 'gtag' && !/^(G-|GTM-)/.test(tagId)) return [];
		const key = `${tag.provider}:${tagId}`;
		if (seen.has(key)) return [];
		seen.add(key);
		return [{ ...tag, tagId }];
	});
}

const ORIGINS: Record<TagProvider, { script: string[]; connect: string[]; img: string[] }> = {
	gtag: {
		script: ['https://www.googletagmanager.com'],
		connect: [
			'https://www.googletagmanager.com',
			'https://www.google-analytics.com',
			'https://region1.google-analytics.com',
			'https://www.google.com'
		],
		img: [
			'https://www.googletagmanager.com',
			'https://www.google-analytics.com',
			'https://region1.google-analytics.com'
		]
	},
	fb_pixel: {
		script: ['https://connect.facebook.net'],
		connect: ['https://www.facebook.com'],
		img: ['https://www.facebook.com']
	},
	tiktok_pixel: {
		script: ['https://analytics.tiktok.com', 'https://analytics.us.tiktok.com'],
		connect: ['https://analytics.tiktok.com', 'https://analytics.us.tiktok.com'],
		img: ['https://analytics.tiktok.com', 'https://analytics.us.tiktok.com']
	},
	histats: {
		script: ['https://s10.histats.com', 'https://s4.histats.com'],
		connect: ['https://s4.histats.com'],
		img: ['https://s4.histats.com', 'https://sstatic1.histats.com']
	}
};

function interstitialCsp(nonce: string, tags: PageTag[]): string {
	const sources = (kind: 'script' | 'connect' | 'img') =>
		[...new Set(tags.flatMap((tag) => ORIGINS[tag.provider][kind]))].join(' ');
	return `${BASE_CSP}; script-src 'nonce-${nonce}'${tags.length ? ` ${sources('script')}` : ''}; script-src-attr 'none'; connect-src ${sources('connect') || "'none'"}; img-src ${sources('img') || "'none'"}; frame-src 'none'`;
}

/** Fixed templates only. Third-party loaders/containers are trusted code, not an HTML sandbox. */
function analyticsScript(tags: PageTag[]): string {
	const ids = (provider: TagProvider) =>
		tags.filter((tag) => tag.provider === provider).map((tag) => tag.tagId);
	const google = ids('gtag');
	const ga4 = google.filter((id) => id.startsWith('G-'));
	const gtm = google.filter((id) => id.startsWith('GTM-'));
	const facebook = ids('fb_pixel');
	const tiktok = ids('tiktok_pixel');
	const histats = ids('histats');
	const snippets: string[] = [];
	if (google.length)
		snippets.push(`
window.dataLayer = window.dataLayer || [];
window.gtag = function () { window.dataLayer.push(arguments); };
window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
${
	ga4.length
		? `window.gtag('js', new Date());
${inlineJson(ga4)}.forEach(function (id) { window.gtag('config', id, { send_page_view: true, allow_google_signals: false, allow_ad_personalization_signals: false }); });
loadScript('https://www.googletagmanager.com/gtag/js?id=' + ${inlineJson(ga4[0])});`
		: ''
}
${
	gtm.length
		? `${inlineJson(gtm)}.forEach(function (id) {
window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
loadScript('https://www.googletagmanager.com/gtm.js?id=' + id);
});`
		: ''
}`);
	if (facebook.length)
		snippets.push(`
var fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
window._fbq = fbq;
fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
${inlineJson(facebook)}.forEach(function (id) { fbq('init', id); fbq('trackSingle', id, 'PageView'); });
loadScript('https://connect.facebook.net/en_US/fbevents.js');`);
	if (tiktok.length)
		snippets.push(`
window.TiktokAnalyticsObject = 'ttq';
var ttq = window.ttq = [];
ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
ttq.setAndDefer = function (target, method) { target[method] = function () { target.push([method].concat(Array.prototype.slice.call(arguments))); }; };
ttq.methods.forEach(function (method) { ttq.setAndDefer(ttq, method); });
ttq._i = {}; ttq._t = {}; ttq._o = {};
ttq.instance = function (id) { var instance = ttq._i[id] || []; ttq.methods.forEach(function (method) { ttq.setAndDefer(instance, method); }); return instance; };
${inlineJson(tiktok)}.forEach(function (id) {
var url = 'https://analytics.tiktok.com/i18n/pixel/events.js';
ttq._i[id] = []; ttq._i[id]._u = url; ttq._t[id] = Date.now(); ttq._o[id] = {};
loadScript(url + '?sdkid=' + id + '&lib=ttq');
});
ttq.page();`);
	if (histats.length)
		snippets.push(`
window._Hasync = window._Hasync || [];
${inlineJson(histats)}.forEach(function (id) {
window._Hasync.push(['Histats.start', '1,' + id + ',4,0,0,0,00010000']);
window._Hasync.push(['Histats.fasi', '1']);
window._Hasync.push(['Histats.track_hits', '']);
});
loadScript('https://s10.histats.com/js15_as.js');`);
	// A blocked or broken provider must not prevent other loaders or the navigation timer.
	return snippets
		.map(
			(snippet) =>
				`try { ${snippet}\n} catch (_) { /* Best effort; no delivery acknowledgement is assumed. */ }`
		)
		.join('\n');
}

/** Throws TypeError for an invalid destination rather than emitting an unsafe navigation target. */
export function renderInterstitial(
	config: InterstitialConfig,
	destinationUrl: string,
	tags: PageTag[],
	options: InterstitialOptions = {}
): Response {
	// Forwarded query parameters can make the assembled URL longer than a stored destination.
	const destination = publicUrl(destinationUrl, 16_384);
	if (!destination) throw new TypeError('A valid public HTTP(S) destination is required');
	const activeTags = options.trackingEnabled === false ? [] : validTags(tags);
	const delay = Number.isNaN(config.delayMs)
		? 0
		: Math.min(MAX_DELAY_MS, Math.max(0, Math.trunc(config.delayMs)));
	// This is a total page budget, not a new timeout on consent or a wait for vendor callbacks.
	const deadline = activeTags.length ? Math.max(delay, 1500) : delay;
	const nonce = randomBytes(18).toString('base64');
	const headers = pageHeaders();
	headers.set('Content-Security-Policy', interstitialCsp(nonce, activeTags));
	const script = `(function () {
'use strict';
var data = ${inlineJson({ destinationUrl: destination, delayMs: deadline })};
var finished = false;
var deadlineAt = performance.now() + data.delayMs;
var countdownTimer;
function continueNow() {
if (finished) return;
finished = true;
window.clearInterval(countdownTimer);
countdown.textContent = 'Redirecting now.';
document.getElementById('redirect-status').textContent = 'Redirecting now.';
window.location.replace(data.destinationUrl);
}
var timer = window.setTimeout(continueNow, Math.max(0, deadlineAt - performance.now()));
var countdown = document.getElementById('redirect-countdown');
var lastSeconds;
function updateCountdown() {
var seconds = Math.max(0, Math.ceil((deadlineAt - performance.now()) / 1000));
if (seconds !== lastSeconds) {
lastSeconds = seconds;
countdown.textContent = seconds > 0 ? 'Redirecting in ' + seconds + (seconds === 1 ? ' second.' : ' seconds.') : 'Redirecting now.';
}
}
countdown.hidden = false;
updateCountdown();
countdownTimer = window.setInterval(updateCountdown, 250);
document.getElementById('continue').addEventListener('click', function () {
finished = true;
window.clearTimeout(timer);
window.clearInterval(countdownTimer);
countdown.hidden = true;
document.getElementById('redirect-status').textContent = 'Continuing to the destination.';
});
${
	activeTags.length
		? `var consent = document.getElementById('allow-analytics');
var privacyBlocked = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1';
if (privacyBlocked) consent.hidden = true;
var allowed = false;
var nonce = document.currentScript.nonce;
function loadScript(src) {
var script = document.createElement('script');
script.async = true; script.src = src; script.nonce = nonce; script.referrerPolicy = 'no-referrer';
document.head.appendChild(script);
}
consent.addEventListener('click', function () {
if (privacyBlocked || allowed || finished) return;
allowed = true;
consent.disabled = true;
consent.textContent = 'Analytics allowed for this visit';
${analyticsScript(activeTags)}
});`
		: ''
}
})();`;
	return new Response(
		`<!doctype html>
<html lang="en"><head>${metadata(config)}</head><body><main>
${campaign(config)}
<p>You are leaving this campaign for <strong>${escapeHtml(new URL(destination).host)}</strong>.</p>
<p>Destination: ${destinationLink(destination)}</p>
<p id="redirect-status" role="status" aria-live="polite" aria-atomic="true">You can continue immediately without allowing analytics. With JavaScript enabled, this page redirects automatically.</p>
<p id="redirect-countdown" role="timer" aria-live="off" aria-label="Time until automatic redirect" hidden></p>
<a id="continue" href="${escapeHtml(destination)}" rel="noreferrer noopener">Continue now</a>
${activeTags.length ? '<p>Optional analytics shares this visit with the campaign’s analytics providers and may use cookies. Delivery is not guaranteed. Choosing nothing continues without loading analytics.</p>\n<button id="allow-analytics" type="button">Allow analytics</button>' : '<p>Optional analytics is disabled for this visit.</p>'}
<noscript><p>JavaScript is disabled. ${destinationLink(destination, 'Continue to the destination')} manually; analytics will not load.</p></noscript>
</main><script nonce="${escapeHtml(nonce)}">${script}</script></body></html>`,
		{ headers }
	);
}
