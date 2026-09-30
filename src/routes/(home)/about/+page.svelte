<script lang="ts">
	import { Badge } from '@/components/ui/badge';

	const values = [
		{
			title: 'Routing is infrastructure',
			desc: 'A redirect is a small piece of infrastructure, not a marketing gimmick. We build it to be reliable first.'
		},
		{
			title: 'Control belongs to the sender',
			desc: 'You decide who gets through and where they land — not a black-box algorithm.'
		},
		{
			title: 'Free means the core product',
			desc: 'We keep rotation, blocking, and verification free because they are the reason the product exists.'
		}
	];

	const timeline = [
		{
			year: '2023',
			text: 'Started as an internal tool for rotating dead affiliate links across live offers.'
		},
		{
			year: '2024',
			text: 'Added IP, domain, and device blocking after abuse traffic skewed early click data.'
		},
		{
			year: '2025',
			text: 'Introduced Playwright-based verification to separate real visitors from automated traffic.'
		},
		{ year: '2026', text: 'Opened Bitfy up for anyone to use, free.' }
	];
</script>

<section class="mx-auto max-w-3xl px-5 py-20">
	<Badge variant="default">About</Badge>
	<h1
		class="mt-5 font-display text-4xl leading-tight font-semibold text-balance text-ink dark:text-paper"
	>
		We built the link infrastructure we couldn't find elsewhere
	</h1>
	<p class="mt-6 leading-relaxed text-balance text-muted-foreground">
		Bitfy started because a single short link kept breaking in the same way: one destination, no
		fallback, and no way to tell a real visitor from a bot before the redirect fired. Rotating
		between multiple URLs, filtering by IP and device, and verifying traffic with Playwright weren't
		optional extras — they were the actual problem to solve. So that's what we built.
	</p>
</section>

<section class="border-t border-line-light py-20 dark:border-line-dark">
	<div class="mx-auto max-w-5xl px-5">
		<h2 class="font-display text-2xl font-semibold text-ink dark:text-paper">
			What we optimize for
		</h2>
		<div class="mt-10 grid gap-8 sm:grid-cols-3">
			{#each values as v, i (i)}
				<div>
					<h3 class="font-display text-base font-semibold text-ink dark:text-paper">{v.title}</h3>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="border-t border-line-light py-20 dark:border-line-dark">
	<div class="mx-auto max-w-3xl px-5">
		<h2 class="font-display text-2xl font-semibold text-ink dark:text-paper">How it's grown</h2>
		<div class="mt-10 space-y-8">
			{#each timeline as item, i (i)}
				<div class="flex gap-6">
					<span class="w-14 shrink-0 font-mono text-sm text-signal">{item.year}</span>
					<p class="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<section class="border-t border-line-light py-20 dark:border-line-dark">
	<div class="mx-auto max-w-3xl px-5 text-center">
		<h2 class="font-display text-2xl font-semibold text-ink dark:text-paper">
			Want to reach the team?
		</h2>
		<p class="mt-3 text-muted-foreground">
			<a href="/contact" class="font-medium text-signal hover:underline">Get in touch</a> — we read every
			message.
		</p>
	</div>
</section>
