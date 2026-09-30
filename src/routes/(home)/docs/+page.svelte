<script lang="ts">
	import { CopyButton } from '$lib/components/ui/copy-button';

	const nav = [
		{ id: 'getting-started', title: 'Getting started' },
		{ id: 'creating-a-rotation', title: 'Creating a rotation' },
		{ id: 'blocking-rules', title: 'Blocking rules' },
		{ id: 'redirect-modes', title: 'Redirect modes' },
		{ id: 'referrer-control', title: 'Attribution & referrer' },
		{ id: 'playwright-verification', title: 'Playwright verification' },
		{ id: 'api-reference', title: 'API reference' }
	];
</script>

<section class="mx-auto max-w-6xl px-5 py-16">
	<div class="grid gap-12 lg:grid-cols-[220px_1fr]">
		<nav class="hidden lg:block">
			<p class="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
				On this page
			</p>
			<ul class="sticky top-24 space-y-3 text-sm">
				{#each nav as item}
					<li>
						<a
							href={`#${item.id}`}
							class="text-muted-foreground hover:text-ink dark:hover:text-paper">{item.title}</a
						>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="max-w-2xl space-y-16">
			<div>
				<h1 class="font-display text-4xl font-semibold text-ink dark:text-paper">Documentation</h1>
				<p class="mt-3 text-muted-foreground">
					Everything you need to route your first link, and every rule after it.
				</p>
			</div>

			<div id="getting-started">
				<h2 class="font-display text-2xl font-semibold text-ink dark:text-paper">
					Getting started
				</h2>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
					After creating a free account, every short link lives under your workspace's domain. A
					link is made of one or more destinations, an optional set of blocking rules, and a
					redirect mode. Nothing is billed by usage — create as many as you need.
				</p>
				<div
					class="relative mt-4 rounded-xl border border-line-light bg-muted p-5 dark:border-line-dark"
				>
					<CopyButton class="absolute top-2 right-2" text="Copy" />
					<pre class="overflow-x-auto font-mono text-xs leading-relaxed"><code
							>{`curl -X POST https://api.Bitfy.example/v1/links \\
  -H "Authorization: Bearer $Bitfy_TOKEN" \\
  -d '{ "slug": "promo", "destinations": ["https://a.com/offer"] }'`}</code
						></pre>
				</div>
			</div>

			<div id="creating-a-rotation">
				<h2 class="font-display text-2xl font-semibold text-ink dark:text-paper">
					Creating a rotation
				</h2>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
					Add more than one destination to a link and assign each a weight. Weights don't need to
					add up to 100 — they're evaluated as relative proportions, so <code
						class="font-mono text-ink dark:text-paper">2</code
					>
					and
					<code class="font-mono text-ink dark:text-paper">1</code> behaves the same as
					<code class="font-mono text-ink dark:text-paper">66</code>
					and
					<code class="font-mono text-ink dark:text-paper">33</code>.
				</p>
				<div
					class="relative mt-4 rounded-xl border border-line-light bg-muted p-5 dark:border-line-dark"
				>
					<CopyButton class="absolute top-2 right-2" text="Copy" />
					<pre class="overflow-x-auto font-mono text-xs leading-relaxed"><code
							>{`{
  "destinations": [
    { "url": "https://a.com/offer", "weight": 50 },
    { "url": "https://b.com/offer", "weight": 35 },
    { "url": "https://c.com/offer", "weight": 15 }
  ]
}`}</code
						></pre>
				</div>
			</div>

			<div id="blocking-rules">
				-
				<h2 class="font-display text-2xl font-semibold text-ink dark:text-paper">Blocking rules</h2>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
					Rules are evaluated in order, top to bottom, before a rotation destination is chosen. A
					rule can match on IP or CIDR range, referring domain, device type, operating system, or
					browser, and can either <code class="font-mono text-ink dark:text-paper">block</code> or
					<code class="font-mono text-ink dark:text-paper">allow</code> the request.
				</p>
				<div
					class="relative mt-4 rounded-xl border border-line-light bg-muted p-5 dark:border-line-dark"
				>
					<CopyButton class="absolute top-2 right-2" text="Copy" />
					<pre class="overflow-x-auto font-mono text-xs leading-relaxed">
<code
							>{`{
  "rules": [
    { "type": "ip_range", "value": "203.0.113.0/24", "action": "block" },
    { "type": "device", "value": "headless", "action": "block" },
    { "type": "domain", "value": "spam-referrer.com", "action": "block" }
  ]
}`}</code
						>
          </pre>
				</div>
			</div>

			<div id="redirect-modes">
				<h2 class="font-display text-2xl font-semibold text-ink dark:text-paper">Redirect modes</h2>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
					Each link has a <code class="font-mono text-ink dark:text-paper">redirect_mode</code> of
					<code class="font-mono text-ink dark:text-paper">deeplink</code>,
					<code class="font-mono text-ink dark:text-paper">safelink</code>, or
					<code class="font-mono text-ink dark:text-paper">direct</code>. Deeplink mode requires an
					<code class="font-mono text-ink dark:text-paper">app_scheme</code> and a web fallback URL.
				</p>
			</div>

			<div id="referrer-control">
				<h2 class="font-display text-2xl font-semibold text-ink dark:text-paper">
					Attribution & referrer
				</h2>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
					Use source attribution to append <code class="font-mono text-ink dark:text-paper"
						>utm_source</code
					>,
					<code class="font-mono text-ink dark:text-paper">utm_medium</code>, and
					<code class="font-mono text-ink dark:text-paper">utm_campaign</code> to destinations. Referrer
					policy can preserve the browser-provided value or strip it; browsers do not permit redirects
					to impersonate another site's HTTP referrer.
				</p>
			</div>

			<div id="playwright-verification">
				<h2 class="font-display text-2xl font-semibold text-ink dark:text-paper">
					Playwright verification
				</h2>
				<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
					When enabled, an incoming click is briefly held while a headless Playwright check
					fingerprints the client for automation signals — inconsistent viewport and navigator
					properties, missing plugins, and known headless markers. Requests that fail the check are
					routed to your configured fallback instead of a live destination.
				</p>
			</div>

			<div id="api-reference">
				<h2 class="font-display text-2xl font-semibold text-ink dark:text-paper">API reference</h2>
				<div class="mt-4 divide-y divide-line-light dark:divide-line-dark">
					{#each [{ method: 'POST', path: '/v1/links', desc: 'Create a link with destinations and rules.' }, { method: 'GET', path: '/v1/links/:slug', desc: 'Fetch a link and its current configuration.' }, { method: 'PATCH', path: '/v1/links/:slug/rules', desc: 'Update blocking rules for a link.' }, { method: 'GET', path: '/v1/links/:slug/clicks', desc: 'Read click history for a link.' }] as endpoint}
						<div class="flex items-center gap-4 py-3.5">
							<span class="w-16 shrink-0 font-mono text-xs font-medium text-signal"
								>{endpoint.method}</span
							>
							<span class="font-mono text-xs text-ink dark:text-paper">{endpoint.path}</span>
							<span class="ml-auto text-right text-xs text-muted-foreground">{endpoint.desc}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>
