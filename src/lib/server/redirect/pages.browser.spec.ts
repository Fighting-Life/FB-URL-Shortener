import { createServer, type Server } from 'node:http';
import type { Browser, BrowserContext } from 'playwright';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { renderInterstitial, type PageTag } from './pages';

// Opt in explicitly; normal server unit tests neither import Chromium nor launch a browser.
// RUN_REDIRECT_BROWSER_TESTS=1 pnpm exec vitest run --project server src/lib/server/redirect/pages.browser.spec.ts
const enabled = process.env.RUN_REDIRECT_BROWSER_TESTS === '1';

const config = {
	name: 'Browser fixture campaign',
	ogTitle: 'Browser fixture title',
	ogDescription: 'A local test, not a real campaign.',
	ogImage: null
};
const tags: PageTag[] = [
	{ provider: 'gtag', tagId: 'G-AB12CD34EF', isActive: true },
	{ provider: 'gtag', tagId: 'GTM-5XK2Q9P', isActive: true },
	{ provider: 'fb_pixel', tagId: '123456789012345', isActive: true },
	{ provider: 'tiktok_pixel', tagId: 'C4ABCDEFGHIJKLMNOPQR', isActive: true },
	{ provider: 'histats', tagId: '4912345', isActive: true }
];
const vendorScripts = [
	'https://www.googletagmanager.com/gtag/js?id=G-AB12CD34EF',
	'https://www.googletagmanager.com/gtm.js?id=GTM-5XK2Q9P',
	'https://connect.facebook.net/en_US/fbevents.js',
	'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=C4ABCDEFGHIJKLMNOPQR&lib=ttq',
	'https://s10.histats.com/js15_as.js'
];

describe.skipIf(!enabled)('redirect pages in Chromium (opt-in, local network only)', () => {
	let browser: Browser | undefined;
	let server: Server | undefined;
	let origin = '';
	let destination = '';
	let servedAt = 0;
	const contexts = new Set<BrowserContext>();
	const fixtures = new Map<string, Response>();
	const received: Array<{ url: string; referer: string | undefined; at: number }> = [];

	beforeAll(async () => {
		const { chromium } = await import('playwright');
		try {
			browser = await chromium.launch({ headless: true, timeout: 10_000 });
		} catch (cause) {
			throw new Error(
				'Opt-in redirect browser tests could not launch Chromium. If its binary is missing, request permission before installing it; no installation was attempted.',
				{ cause }
			);
		}
		server = createServer((request, response) => {
			const url = new URL(request.url ?? '/', origin);
			if (url.pathname === '/destination') {
				received.push({ url: request.url!, referer: request.headers.referer, at: Date.now() });
				response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
				response.end('<!doctype html><title>Local destination</title><p>Destination reached</p>');
				return;
			}
			const fixture = fixtures.get(url.pathname);
			if (!fixture) {
				response.writeHead(404);
				response.end();
				return;
			}
			void fixture
				.text()
				.then((html) => {
					response.writeHead(fixture.status, Object.fromEntries(fixture.headers));
					servedAt = Date.now();
					response.end(html);
				})
				.catch(() => {
					response.writeHead(500);
					response.end('Fixture rendering failed');
				});
		});
		server.requestTimeout = 5000;
		server.headersTimeout = 5000;
		await new Promise<void>((resolve, reject) => {
			server!.once('error', reject);
			server!.listen(0, '127.0.0.1', resolve);
		});
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('No fixture server port');
		origin = `http://127.0.0.1:${address.port}`;
		// Keep the real public-URL validator. Playwright rewrites only this synthetic origin to
		// loopback at the network layer, preserving the browser's URL, query, and request headers.
		const target = new URL(`http://destination.example.test:${address.port}/destination`);
		target.searchParams.set('source', 'a&b');
		target.searchParams.set('message', "'</script><script>not executable</script>");
		target.searchParams.set('forwarded', 'x'.repeat(3000));
		destination = target.href;
	}, 20_000);

	beforeEach(() => {
		fixtures.clear();
		received.length = 0;
		servedAt = 0;
	});

	afterEach(async () => {
		await Promise.all([...contexts].map((context) => context.close()));
		contexts.clear();
	}, 10_000);

	afterAll(async () => {
		try {
			await browser?.close();
		} finally {
			if (server?.listening) {
				await new Promise<void>((resolve, reject) => {
					server!.close((error) => (error ? reject(error) : resolve()));
					server!.closeAllConnections();
				});
			}
		}
	}, 10_000);

	async function open(delayMs: number, javaScriptEnabled = true) {
		const context = await browser!.newContext({ javaScriptEnabled, serviceWorkers: 'block' });
		contexts.add(context);
		context.setDefaultTimeout(3000);
		context.setDefaultNavigationTimeout(6000);
		const external: Array<{ url: string; referer: string | undefined }> = [];
		const unexpected: string[] = [];
		const destinationOrigin = new URL(destination).origin;
		await context.route('**/*', async (route) => {
			const request = route.request();
			const url = new URL(request.url());
			if (url.origin === origin) {
				await route.continue();
			} else if (url.origin === destinationOrigin) {
				await route.continue({ url: origin + url.pathname + url.search });
			} else {
				external.push({ url: url.href, referer: request.headers().referer });
				if (vendorScripts.includes(url.href)) {
					await route.fulfill({
						status: 200,
						contentType: 'application/javascript',
						body: 'document.documentElement.dataset.mockVendor = "loaded";'
					});
				} else {
					unexpected.push(url.href);
					await route.abort();
				}
			}
		});
		fixtures.set('/interstitial', renderInterstitial({ ...config, delayMs }, destination, tags));
		const page = await context.newPage();
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));
		const response = await page.goto(origin + '/interstitial');
		return { page, response: response!, external, unexpected, errors };
	}

	function expectDestination() {
		expect(received).toHaveLength(1);
		expect(received[0].referer).toBeUndefined();
		const expected = new URL(destination);
		expect(received[0].url).toBe(expected.pathname + expected.search);
	}

	it('executes the nonce bootstrap under actual CSP, counts down, and redirects without referrer or consent', async () => {
		const { page, response, external, errors } = await open(2500);
		expect(response.headers()['referrer-policy']).toBe('no-referrer');
		expect(response.headers()['content-security-policy']).toContain("default-src 'none'");
		expect(await page.locator('#redirect-countdown').isVisible()).toBe(true);
		expect(await page.locator('#redirect-countdown').getAttribute('aria-live')).toBe('off');
		expect(await page.getByRole('status').getAttribute('aria-live')).toBe('polite');
		const directive = await page.evaluate(
			() =>
				new Promise<string>((resolve) => {
					const fallback = setTimeout(() => resolve('no violation'), 1000);
					document.addEventListener(
						'securitypolicyviolation',
						(event) => {
							clearTimeout(fallback);
							resolve(event.violatedDirective);
						},
						{ once: true }
					);
					const script = document.createElement('script');
					script.textContent = 'document.documentElement.dataset.untrusted = "executed";';
					document.head.appendChild(script);
				})
		);
		expect(directive).toBe('script-src-elem');
		expect(await page.locator('html').getAttribute('data-untrusted')).toBeNull();
		await page.waitForFunction(
			() =>
				document.getElementById('redirect-countdown')?.textContent === 'Redirecting in 1 second.'
		);
		expect(external).toEqual([]);
		await page.waitForURL(destination);
		expectDestination();
		expect(received[0].at - servedAt).toBeGreaterThanOrEqual(2450);
		expect(received[0].at - servedAt).toBeLessThan(6000);
		expect(external).toEqual([]);
		expect(errors).toEqual([]);
	}, 10_000);

	it('allows immediate manual continuation without waiting for the countdown or consent', async () => {
		const { page, external, errors } = await open(10_000);
		await page.getByRole('link', { name: 'Continue now', exact: true }).click();
		await page.waitForURL(destination);
		expectDestination();
		expect(received[0].at - servedAt).toBeLessThan(5000);
		expect(external).toEqual([]);
		expect(errors).toEqual([]);
	}, 10_000);

	it('keeps the no-JS link usable, hides the inactive countdown, and never loads analytics', async () => {
		const { page, external } = await open(0, false);
		expect(await page.locator('#redirect-countdown').isVisible()).toBe(false);
		// Wait beyond the analytics opportunity to prove the no-JS page does not navigate itself.
		await new Promise((resolve) => setTimeout(resolve, 1800));
		expect(page.url()).toBe(origin + '/interstitial');
		expect(received).toEqual([]);
		await page.getByRole('link', { name: 'Continue to the destination', exact: true }).click();
		await page.waitForURL(destination);
		expectDestination();
		expect(external).toEqual([]);
	}, 10_000);

	it('loads only intercepted provider mocks after consent under CSP, with no referrer', async () => {
		const { page, external, unexpected, errors } = await open(10_000);
		expect(external).toEqual([]);
		await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
		await expect.poll(() => external.length, { timeout: 3000 }).toBe(vendorScripts.length);
		await page.waitForFunction(() => document.documentElement.dataset.mockVendor === 'loaded');
		expect(external.map((request) => request.url).sort()).toEqual([...vendorScripts].sort());
		for (const request of external) expect(request.referer).toBeUndefined();
		expect(unexpected).toEqual([]);
		expect(errors).toEqual([]);
		await page.getByRole('link', { name: 'Continue now', exact: true }).click();
		await page.waitForURL(destination);
		expectDestination();
	}, 10_000);
});
