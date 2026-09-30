import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	pageHeaders,
	renderInterstitial,
	renderPreview,
	type PageConfig,
	type PageTag
} from './pages';

const campaign: PageConfig = {
	name: 'September campaign',
	ogTitle: 'September offer',
	ogDescription: 'Campaign description, not scraped destination content.',
	ogImage: 'https://images.example.com/offer.jpg?size=large&format=webp'
};
const destination = 'https://shop.example.com/offer?source=campaign&lang=en';
const tags: PageTag[] = [
	{ provider: 'gtag', tagId: 'G-AB12CD34EF', isActive: true },
	{ provider: 'gtag', tagId: 'GTM-5XK2Q9P', isActive: true },
	{ provider: 'fb_pixel', tagId: '123456789012345', isActive: true },
	{ provider: 'tiktok_pixel', tagId: 'C4ABCDEFGHIJKLMNOPQR', isActive: true },
	{ provider: 'histats', tagId: '4912345', isActive: true }
];

function interstitial(delayMs = 0, inputTags = tags, trackingEnabled = true) {
	return renderInterstitial({ ...campaign, delayMs }, destination, inputTags, { trackingEnabled });
}

/** Execute only our inline bootstrap: vendor resources are recorded, never fetched/executed. */
async function browser(
	response: Response,
	privacy: Record<string, unknown> = {},
	failLoads = false
) {
	vi.useFakeTimers();
	const html = await response.text();
	const match = /<script nonce="([^"]+)">([\s\S]*?)<\/script>/.exec(html);
	expect(match).not.toBeNull();
	const scripts: Array<{ src: string; nonce: string; async: boolean; referrerPolicy: string }> = [];
	const handlers = new Map<string, () => void>();
	const buttons = new Map<string, { disabled: boolean; hidden: boolean; textContent: string }>();
	const replace = vi.fn();
	const window: Record<string, unknown> = {
		location: { replace },
		setTimeout,
		clearTimeout,
		setInterval,
		clearInterval
	};
	const document = {
		currentScript: { nonce: match![1] },
		getElementById(id: string) {
			const button = {
				disabled: false,
				hidden: false,
				textContent: '',
				addEventListener(_event: string, callback: () => void) {
					handlers.set(id, callback);
				}
			};
			buttons.set(id, button);
			return button;
		},
		createElement() {
			return {};
		},
		head: {
			appendChild(script: (typeof scripts)[number]) {
				if (failLoads) throw new Error('CSP or network failure');
				scripts.push(script);
			}
		}
	};
	runInNewContext(
		match![2],
		{ window, document, navigator: privacy, performance: { now: () => Date.now() } },
		{ timeout: 1000 }
	);
	return {
		html,
		scripts,
		window,
		replace,
		buttons,
		click(id: string) {
			handlers.get(id)?.();
		}
	};
}

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('standalone redirect pages', () => {
	it('returns fresh restrictive headers with no referrer, indexing, framing, or caching', () => {
		const headers = pageHeaders();
		expect(headers.get('content-type')).toBe('text/html; charset=utf-8');
		expect(headers.get('cache-control')).toBe('no-store');
		expect(headers.get('x-robots-tag')).toBe('noindex, nofollow');
		expect(headers.get('x-content-type-options')).toBe('nosniff');
		expect(headers.get('referrer-policy')).toBe('no-referrer');
		expect(headers.get('x-frame-options')).toBe('DENY');
		expect(headers.get('content-security-policy')).toContain("default-src 'none'");
		expect(headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
		headers.set('set-cookie', 'should-not-leak=1');
		expect(pageHeaders().has('set-cookie')).toBe(false);
	});

	it('uses matching, visibly disclosed campaign metadata, not destination impersonation', async () => {
		const canonical = 'https://short.example.com/september?a=1&b=2';
		const preview = await renderPreview(campaign, [destination], canonical).text();
		const human = await interstitial().text();
		for (const html of [preview, human]) {
			expect(html).toContain('<title>September offer</title>');
			expect(html).toContain('<h1>September offer</h1>');
			expect(html).toContain('Campaign: September campaign');
			expect(html).toContain('<meta property="og:title" content="September offer">');
			expect(html).toContain(
				`<meta property="og:description" content="${campaign.ogDescription}">`
			);
			expect(html).toContain(`<p>${campaign.ogDescription}</p>`);
			expect(html).toContain(
				'<meta property="og:image" content="https://images.example.com/offer.jpg?size=large&amp;format=webp">'
			);
			expect(html).toContain('shop.example.com');
			expect(html).not.toMatch(/<img|svelte|session/i);
		}
		expect(preview).toContain(
			'<meta property="og:url" content="https://short.example.com/september?a=1&amp;b=2">'
		);
		expect(preview).toContain('destination content has not been verified');
		// The interstitial API has no canonical campaign URL; do not pretend the destination is it.
		expect(human).not.toContain('property="og:url"');
	});

	it('previews every valid destination without scripts, trackers, fetching, or automatic redirects', async () => {
		const fetch = vi.spyOn(globalThis, 'fetch');
		const response = renderPreview(
			campaign,
			[destination, 'http://other.example.com/path', destination, 'javascript:alert(1)'],
			'https://short.example.com/x'
		);
		const html = await response.text();
		expect(html.match(/<li>/g)).toHaveLength(2);
		expect(html).toContain('<strong>other.example.com</strong>');
		expect(html).toContain('https://shop.example.com/offer?source=campaign&amp;lang=en');
		expect(html).not.toMatch(
			/<script|<iframe|<img|http-equiv|javascript:|gtag|fbq|ttq|histats|console\./i
		);
		expect(fetch).not.toHaveBeenCalled();
		expect(response.headers.has('set-cookie')).toBe(false);
	});

	it('handles absent metadata and invalid optional URLs without inventing metadata', async () => {
		const html = await renderPreview(
			{ name: 'Name only', ogTitle: null, ogDescription: null, ogImage: 'data:image/svg+xml,evil' },
			['http://localhost'],
			'javascript:alert(1)'
		).text();
		expect(html).toContain('<title>Name only</title>');
		expect(html).toContain('No valid public destinations');
		expect(html).not.toMatch(/og:image|og:description|og:url|rel="canonical"/);
	});

	it('escapes text and all URL/metadata attributes and cannot close the inline script', async () => {
		const attack = `</script><script>alert('x')</script><img src=x onerror="alert(1)">&`;
		const config = {
			name: attack,
			ogTitle: attack,
			ogDescription: attack,
			ogImage: 'https://images.example.com/?a=" onload="evil&b=1'
		};
		const url = `https://shop.example.com/?a='&b=</script><script>evil</script>`;
		const preview = await renderPreview(config, [url], `https://short.example.com/?x='&y=2`).text();
		const human = await renderInterstitial({ ...config, delayMs: 0 }, url, [
			{ ...tags[2], tagId: attack }
		]).text();
		for (const html of [preview, human]) {
			expect(html).not.toContain(attack);
			expect(html).toContain('&lt;/script&gt;&lt;script&gt;alert(&#39;x&#39;)');
			expect(html).not.toContain('<img');
			expect(html).toContain('&amp;');
			expect(html).toContain('%22');
		}
		expect(preview).not.toContain('<script');
		expect(human.match(/<script\b/g)).toHaveLength(1);
		expect(human.match(/<\/script>/g)).toHaveLength(1);
		const script = /<script nonce="[^"]+">([\s\S]*?)<\/script>/.exec(human)![1];
		expect(script).toContain('\\u0026');
		expect(script).not.toContain('</script>');
		expect(script).not.toContain('connect.facebook.net');
	});

	it.each([
		'javascript:alert(1)',
		'data:text/html,test',
		'//example.com',
		'https://user:password@example.com',
		'http://127.0.0.1',
		'http://[::1]/',
		'https://printer.local'
	])('rejects unsafe destination %s', (url) => {
		expect(() => renderInterstitial({ ...campaign, delayMs: 0 }, url, tags)).toThrow(TypeError);
	});

	it.each([2049, 8192, 16_384])(
		'accepts an assembled destination of %s characters',
		async (length) => {
			const prefix = 'https://shop.example.com/?forwarded=';
			const url = prefix + 'a'.repeat(length - prefix.length);
			const page = await browser(renderInterstitial({ ...campaign, delayMs: 0 }, url, []));
			expect(page.html).toContain(`href="${url}"`);
			vi.advanceTimersByTime(0);
			expect(page.replace).toHaveBeenCalledExactlyOnceWith(url);
		}
	);

	it('rejects oversized assembled or normalized destinations but retains the image limit', async () => {
		const prefix = 'https://shop.example.com/?forwarded=';
		const oversized = prefix + 'a'.repeat(16_385 - prefix.length);
		for (const url of [oversized, prefix + 'é'.repeat(3000)]) {
			expect(() => renderInterstitial({ ...campaign, delayMs: 0 }, url, [])).toThrow(TypeError);
		}
		const config = { ...campaign, delayMs: 0, ogImage: prefix + 'a'.repeat(2049 - prefix.length) };
		const html = await renderInterstitial(config, destination, []).text();
		expect(html).not.toContain('og:image');
	});

	it('keeps immediate noreferrer links and an untracked no-JS fallback', async () => {
		const html = await interstitial().text();
		const links = html.match(/<a\b[^>]+>/g)!;
		expect(links.length).toBeGreaterThanOrEqual(3);
		for (const link of links) expect(link).toContain('rel="noreferrer noopener"');
		expect(html).toContain('id="continue"');
		const noscript = /<noscript>(.*?)<\/noscript>/.exec(html)![1];
		expect(noscript).toContain('Continue to the destination');
		expect(noscript).not.toMatch(/<img|<iframe|<script/);
		expect(html).toContain('Delivery is not guaranteed');
		expect(html).not.toContain('http-equiv="refresh"');
	});
});

describe('consent, bounded navigation, and vetted analytics', () => {
	it('shows a fixed-deadline countdown without announcing every tick', async () => {
		const page = await browser(interstitial(3000));
		const countdown = page.buttons.get('redirect-countdown')!;
		expect(page.html).toContain('role="timer" aria-live="off"');
		expect(page.html).toContain('role="status" aria-live="polite" aria-atomic="true"');
		expect(countdown.hidden).toBe(false);
		expect(countdown.textContent).toBe('Redirecting in 3 seconds.');
		vi.advanceTimersByTime(1000);
		expect(countdown.textContent).toBe('Redirecting in 2 seconds.');
		page.click('allow-analytics');
		vi.advanceTimersByTime(1000);
		expect(countdown.textContent).toBe('Redirecting in 1 second.');
		expect(page.buttons.has('redirect-status')).toBe(false);
		vi.advanceTimersByTime(1000);
		expect(countdown.textContent).toBe('Redirecting now.');
		expect(page.buttons.get('redirect-status')?.textContent).toBe('Redirecting now.');
		expect(page.replace).toHaveBeenCalledExactlyOnceWith(destination);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('derives remaining time from the deadline rather than counting interval callbacks', async () => {
		const page = await browser(interstitial(5000));
		vi.setSystemTime(Date.now() + 3000);
		vi.advanceTimersByTime(250);
		expect(page.buttons.get('redirect-countdown')?.textContent).toBe('Redirecting in 2 seconds.');
	});
	it('loads no nonessential resources without consent and still redirects', async () => {
		const page = await browser(interstitial());
		expect(page.scripts).toEqual([]);
		expect(page.window.dataLayer).toBeUndefined();
		expect(page.window.fbq).toBeUndefined();
		vi.advanceTimersByTime(1499);
		expect(page.replace).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(page.replace).toHaveBeenCalledExactlyOnceWith(destination);
		page.click('allow-analytics');
		expect(page.scripts).toEqual([]);
	});

	it('loads fixed async nonce-bearing templates only on the local allow action', async () => {
		const page = await browser(interstitial());
		page.click('allow-analytics');
		expect(page.scripts.map((script) => script.src)).toEqual([
			'https://www.googletagmanager.com/gtag/js?id=G-AB12CD34EF',
			'https://www.googletagmanager.com/gtm.js?id=GTM-5XK2Q9P',
			'https://connect.facebook.net/en_US/fbevents.js',
			'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=C4ABCDEFGHIJKLMNOPQR&lib=ttq',
			'https://s10.histats.com/js15_as.js'
		]);
		for (const script of page.scripts) {
			expect(script.async).toBe(true);
			expect(script.referrerPolicy).toBe('no-referrer');
			expect(page.html).toContain(`nonce="${script.nonce}"`);
		}
		const googleQueue = (page.window.dataLayer as Array<ArrayLike<unknown>>).map((entry) =>
			Array.from(entry)
		);
		expect(googleQueue).toContainEqual([
			'config',
			'G-AB12CD34EF',
			{ send_page_view: true, allow_google_signals: false, allow_ad_personalization_signals: false }
		]);
		const facebook = page.window.fbq as { queue: Array<ArrayLike<unknown>> };
		expect(facebook.queue.map((entry) => Array.from(entry))).toContainEqual([
			'trackSingle',
			'123456789012345',
			'PageView'
		]);
		const tiktok = page.window.ttq as unknown[] & { _i: Record<string, { _u: string }> };
		expect(tiktok[0]).toEqual(['page']);
		expect(tiktok._i.C4ABCDEFGHIJKLMNOPQR._u).toBe(
			'https://analytics.tiktok.com/i18n/pixel/events.js'
		);
		expect(page.window._Hasync).toContainEqual(['Histats.start', '1,4912345,4,0,0,0,00010000']);
		expect(page.buttons.get('allow-analytics')?.disabled).toBe(true);
		page.click('allow-analytics');
		expect(page.scripts).toHaveLength(5);
		vi.advanceTimersByTime(1500);
		expect(page.replace).toHaveBeenCalledExactlyOnceWith(destination);
	});

	it('ignores inactive, malformed, unsupported, unknown-provider, and duplicate tags', async () => {
		const input: PageTag[] = [
			...tags,
			...tags,
			{ ...tags[0], tagId: ' G-AB12CD34EF ' },
			{ ...tags[0], tagId: 'G-ZZZZZZZZ', isActive: false },
			{ ...tags[0], tagId: 'AW-123456789' },
			{ ...tags[0], tagId: 'DC-123456789' },
			{ ...tags[0], tagId: 'GT-123456789' },
			{ ...tags[0], tagId: 'G-ABCD\";alert(1)//' },
			{ ...tags[2], tagId: '123' },
			{ ...tags[3], tagId: 'lowercase_invalid' },
			{ ...tags[4], tagId: 'https://evil.example.com' },
			{ provider: '__proto__' as PageTag['provider'], tagId: 'test', isActive: true }
		];
		const page = await browser(interstitial(0, input));
		page.click('allow-analytics');
		expect(page.scripts).toHaveLength(5);
		expect(page.html).not.toMatch(
			/ZZZZZZZZ|AW-123|DC-123|GT-123|evil\.example|lowercase_invalid|__proto__/
		);
	});

	it('omits every provider, tag ID, and consent control when request privacy disables tracking', async () => {
		const response = interstitial(0, tags, false);
		const csp = response.headers.get('content-security-policy')!;
		const page = await browser(response);
		for (const tag of tags) expect(page.html).not.toContain(tag.tagId);
		expect(page.html).not.toMatch(
			/allow-analytics|googletagmanager|facebook|tiktok|histats|loadScript/
		);
		expect(csp).toContain("connect-src 'none'");
		expect(csp).toContain("img-src 'none'");
		expect(csp).not.toContain('https:');
		page.click('allow-analytics');
		vi.advanceTimersByTime(0);
		expect(page.scripts).toEqual([]);
		expect(page.replace).toHaveBeenCalledExactlyOnceWith(destination);
	});

	it.each([
		{ globalPrivacyControl: true },
		{ doNotTrack: '1' },
		{ doNotTrack: 'yes' },
		{ msDoNotTrack: '1' }
	])('also honors browser privacy signals %j', async (privacy) => {
		const page = await browser(interstitial(), privacy);
		expect(page.buttons.get('allow-analytics')?.hidden).toBe(true);
		page.click('allow-analytics');
		expect(page.scripts).toEqual([]);
		vi.advanceTimersByTime(1500);
		expect(page.replace).toHaveBeenCalledOnce();
	});

	it.each([
		[-100, 0],
		[0, 0],
		[250.9, 250],
		[10_000, 10_000],
		[99_999, 10_000],
		[NaN, 0],
		[Infinity, 10_000],
		[-Infinity, 0]
	])('bounds delay %s to %s ms', async (input, expected) => {
		const page = await browser(interstitial(input, []));
		if (expected > 0) {
			vi.advanceTimersByTime(expected - 1);
			expect(page.replace).not.toHaveBeenCalled();
			vi.advanceTimersByTime(1);
		} else vi.advanceTimersByTime(0);
		expect(page.replace).toHaveBeenCalledExactlyOnceWith(destination);
	});

	it('never extends the fixed deadline for late consent or missing vendor acknowledgements', async () => {
		const page = await browser(interstitial(3000));
		vi.advanceTimersByTime(2999);
		page.click('allow-analytics');
		expect(page.scripts).toHaveLength(5);
		vi.advanceTimersByTime(1);
		expect(page.replace).toHaveBeenCalledExactlyOnceWith(destination);
		vi.advanceTimersByTime(20_000);
		expect(page.replace).toHaveBeenCalledOnce();
	});

	it('keeps the redirect timer when every script loader throws', async () => {
		const page = await browser(interstitial(), {}, true);
		expect(() => page.click('allow-analytics')).not.toThrow();
		vi.advanceTimersByTime(1500);
		expect(page.replace).toHaveBeenCalledExactlyOnceWith(destination);
	});

	it('manual continuation does not wait and cancels the automatic navigation', async () => {
		const page = await browser(interstitial(10_000));
		page.click('continue');
		expect(page.buttons.get('redirect-countdown')?.hidden).toBe(true);
		expect(page.buttons.get('redirect-status')?.textContent).toBe('Continuing to the destination.');
		expect(vi.getTimerCount()).toBe(0);
		page.click('allow-analytics');
		vi.advanceTimersByTime(20_000);
		expect(page.replace).not.toHaveBeenCalled();
		expect(page.scripts).toEqual([]);
	});

	it('uses a fresh nonce and only accepted active providers in CSP, never broad script permissions', async () => {
		const response = interstitial(0, [
			tags[2],
			{ ...tags[0], isActive: false },
			{ ...tags[3], tagId: 'bad' }
		]);
		const csp = response.headers.get('content-security-policy')!;
		const html = await response.text();
		const nonce = /<script nonce="([^"]+)">/.exec(html)![1];
		expect(csp).toContain(`script-src 'nonce-${nonce}' https://connect.facebook.net`);
		expect(csp).toContain('connect-src https://www.facebook.com');
		expect(csp).toContain('img-src https://www.facebook.com');
		expect(csp).toContain("script-src-attr 'none'");
		expect(csp).toContain("frame-src 'none'");
		expect(csp).not.toMatch(/google|tiktok|histats|unsafe-inline|unsafe-eval|strict-dynamic|\*/);
		expect(interstitial().headers.get('content-security-policy')).not.toContain(`nonce-${nonce}`);
		for (const [name, value] of pageHeaders()) {
			if (name !== 'content-security-policy') expect(response.headers.get(name)).toBe(value);
		}
	});
});
