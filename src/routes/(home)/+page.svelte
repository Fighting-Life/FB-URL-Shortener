<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { Badge } from '@/components/ui/badge';
	import * as Card from '@/components/ui/card';
	import {
		Shuffle,
		ShieldBan,
		Fingerprint,
		Route,
		Bot,
		Gift,
		ArrowRight,
		Check,
		Rocket,
		CheckCircle
	} from '@lucide/svelte';

	const features = [
		{
			icon: Shuffle,
			title: 'Multi-URL rotation',
			desc: 'Point one short link at several destinations and rotate between them by weight, order, or schedule — with cloaking so the real URL stays hidden.'
		},
		{
			icon: ShieldBan,
			title: 'Block by IP, domain & device',
			desc: 'Deny or allow traffic by IP range, referring domain, device type, OS, or browser before a redirect ever fires.'
		},
		{
			icon: Fingerprint,
			title: 'Source attribution',
			desc: 'Attach campaign-level UTM source, medium, and campaign values while preserving honest visitor referrer analytics.'
		},
		{
			icon: Route,
			title: 'Flexible redirect modes',
			desc: 'Send traffic through a deeplink, a safelink interstitial, or a direct 302 — chosen per link, per rule.'
		},
		{
			icon: Bot,
			title: 'Playwright bot filtering',
			desc: 'Automated Playwright checks fingerprint incoming clients and route suspected bots and scrapers away from your real destination.'
		},
		{
			icon: Gift,
			title: 'Free, no limits on links',
			desc: 'Every feature above is available on the free plan — no trial period, no link cap, no credit card.'
		}
	];

	const redirectModes = [
		{
			name: 'Deeplink',
			detail: 'Opens directly inside a native app when installed, falling back to the web.'
		},
		{
			name: 'Safelink page',
			detail: 'A branded interstitial that clears the referrer before continuing on.'
		},
		{
			name: 'Direct page',
			detail: 'Immediate 302 redirect straight to the destination, no interstitial.'
		}
	];

	const steps = [
		{
			n: '01',
			title: 'Add your destinations',
			desc: 'Drop in two or more URLs for a single short link and set how traffic should rotate across them.'
		},
		{
			n: '02',
			title: 'Set your access rules',
			desc: 'Block or allow by IP, domain, device, and browser, and choose a redirect mode for the link.'
		},
		{
			n: '03',
			title: 'Share one link',
			desc: 'Every click is checked against your rules, verified by Playwright, then routed to the right destination.'
		}
	];
</script>

<!-- Hero -->
<section class="relative overflow-hidden">
	<div
		class="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-16 pb-16 lg:grid-cols-2 lg:pt-24 lg:pb-24"
	>
		<div>
			<Badge variant="default">Free — no credit card required</Badge>
			<h1
				class="mt-5 max-w-lg font-display text-4xl leading-[1.1] font-semibold tracking-tight text-balance text-ink sm:text-5xl dark:text-paper"
			>
				One link. Many destinations. Full control over who gets through.
			</h1>
			<p class="mt-5 max-w-md text-base leading-relaxed text-balance text-muted-foreground">
				Bitfy cloaks and rotates traffic across multiple URLs, blocks the visitors you don't want,
				and verifies the rest with Playwright before it ever reaches your destination.
			</p>
			<div class="mt-8 flex flex-wrap items-center gap-3">
				<Button href="/signup" size="lg">
					<Rocket />
					Create your first link
					<ArrowRight size={16} />
				</Button>
				<Button href="/docs" variant="outline" size="lg">Read the docs</Button>
			</div>
			<div class="mt-8 flex items-center gap-5 text-xs text-slate-500">
				<span class="flex items-center gap-1.5 text-muted-foreground"
					><CheckCircle size={14} class="text-signal" /> Unlimited links</span
				>
				<span class="flex items-center gap-1.5 text-muted-foreground"
					><CheckCircle size={14} class="text-signal" /> No expiring redirects</span
				>
			</div>
		</div>

		<div class="relative">
			<div
				class="rounded-2xl border border-line-light bg-white p-6 shadow-sm dark:border-line-dark dark:bg-ink-dim"
			>
				<div
					class="flex items-center justify-between border-b border-line-light pb-4 dark:border-line-dark"
				>
					<span class="font-mono text-xs text-muted-foreground">lnkshift.co/promo</span>
					<Badge variant="default">rotating</Badge>
				</div>
				<div class="mt-4 space-y-3">
					{#each [{ label: 'landingpage-a.com/offer', weight: '50%', status: 'active' }, { label: 'landingpage-b.com/offer', weight: '35%', status: 'active' }, { label: 'landingpage-c.com/offer', weight: '15%', status: 'paused' }] as row, i (i)}
						<div
							class="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
						>
							<span class="font-mono text-xs">{row.label}</span>
							<div class="flex items-center gap-2">
								<span class="font-mono text-xs text-muted-foreground">{row.weight}</span>
								<span
									class={`h-1.5 w-1.5 rounded-full ${row.status === 'active' ? 'bg-signal' : 'bg-slate-500/40'}`}
								></span>
							</div>
						</div>
					{/each}
				</div>
				<div
					class="mt-4 rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-muted-foreground shadow-md"
				>
					<span class="text-ember">3 blocked</span> · Poland, headless clients, direct scrapers
				</div>
			</div>
			<div class="absolute -right-5 -bottom-5 -z-10 h-full w-full rounded-2xl bg-background"></div>
		</div>
	</div>
</section>

<!-- Features -->
<section id="features" class="border-t border-line-light py-20 dark:border-line-dark">
	<div class="mx-auto max-w-6xl px-5">
		<div class="max-w-xl">
			<h2 class="font-display text-3xl font-semibold text-ink dark:text-paper">
				Everything a rotating link needs to run itself
			</h2>
			<p class="mt-3 text-muted-foreground">
				Set your rules once. Every click is checked, filtered, and routed automatically.
			</p>
		</div>

		<div class="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
			{#each features as f, i (i)}
				<Card.Root>
					<Card.Content class="p-6">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-lg bg-signal/10 text-signal"
						>
							<f.icon size={18} />
						</div>
						<h3 class="mt-4 font-display text-base font-semibold text-ink dark:text-paper">
							{f.title}
						</h3>
						<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</div>
</section>

<!-- How it works -->
<section class="border-t border-line-light py-20 dark:border-line-dark">
	<div class="mx-auto max-w-6xl px-5">
		<h2 class="font-display text-3xl font-semibold text-ink dark:text-paper">
			How a link is routed
		</h2>

		<div class="mt-12 grid gap-10 md:grid-cols-3">
			{#each steps as step, i (i)}
				<div class="relative">
					<span class="font-mono text-sm text-signal">{step.n}</span>
					<h3 class="mt-3 font-display text-lg font-semibold text-ink dark:text-paper">
						{step.title}
					</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
					{#if i < steps.length - 1}
						<div class="mt-6 hidden h-px w-full bg-line-light md:block dark:bg-line-dark"></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Redirect modes -->
<section class="border-t border-line-light py-20 dark:border-line-dark">
	<div class="mx-auto max-w-6xl px-5">
		<div class="grid gap-12 lg:grid-cols-2 lg:items-center">
			<div>
				<h2 class="font-display text-3xl font-semibold text-ink dark:text-paper">
					Choose how each click lands
				</h2>
				<p class="mt-3 max-w-md text-muted-foreground">
					Redirect mode is set per link, so the same rotation can send app users through a deeplink
					while everyone else sees a safelink or a direct redirect.
				</p>
			</div>
			<div class="space-y-3">
				{#each redirectModes as mode, i (i)}
					<div
						class="flex items-start gap-4 rounded-xl border border-line-light p-5 dark:border-line-dark"
					>
						<span class="mt-1 h-2 w-2 shrink-0 rounded-full bg-signal"></span>
						<div>
							<h3 class="font-display text-sm font-semibold text-ink dark:text-paper">
								{mode.name}
							</h3>
							<p class="mt-1 text-sm text-muted-foreground">{mode.detail}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- Pricing / Free -->
<section id="pricing" class="border-t border-line-light py-20 dark:border-line-dark">
	<div class="mx-auto max-w-3xl px-5 text-center">
		<h2 class="font-display text-3xl font-semibold text-ink dark:text-paper">Free, on purpose</h2>
		<p class="mx-auto mt-3 max-w-md text-muted-foreground">
			Rotation, blocking rules, source attribution, and Playwright verification aren't a paid tier —
			they're the product.
		</p>
		<div
			class="mx-auto mt-10 max-w-sm rounded-2xl border border-line-light bg-white p-8 text-left dark:border-line-dark dark:bg-ink-dim"
		>
			<p class="font-display text-sm font-semibold tracking-wide text-signal uppercase">
				Free plan
			</p>
			<p class="mt-2 font-display text-4xl font-semibold text-ink dark:text-paper">$0</p>
			<ul class="mt-6 space-y-3 text-sm text-muted-foreground">
				{#each ['Unlimited rotating links', 'Full IP, domain & device blocking', 'Custom referrer control', 'Deeplink, safelink & direct modes', 'Playwright bot verification'] as item, i (i)}
					<li class="flex items-center gap-2.5">
						<Check size={15} class="shrink-0 text-signal" />
						{item}
					</li>
				{/each}
			</ul>
			<Button href="/signup" size="lg" class="mt-8 w-full"><Rocket /> Start free</Button>
		</div>
	</div>
</section>

<!-- Final CTA -->
<section class="border-t border-border py-20">
	<div class="mx-auto max-w-6xl px-5">
		<div class="rounded-2xl bg-primary/30 px-8 py-14 text-center sm:px-16 dark:bg-primary/40">
			<h2 class="font-display text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
				Set up your first rotation in minutes
			</h2>
			<p class="mx-auto mt-3 max-w-md text-muted-foreground">
				No trial, no card, no link limits. Just rules that route your traffic correctly.
			</p>
			<Button href="/signup" size="lg" class="mt-8">
				<Rocket />
				Create your account
				<ArrowRight />
			</Button>
		</div>
	</div>
</section>
