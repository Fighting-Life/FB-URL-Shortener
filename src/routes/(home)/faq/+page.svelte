<script lang="ts">
	import { AppAcordion } from '@/components/extra';
	import { Badge } from '@/components/ui/badge';

	const groups = [
		{
			title: 'Rotation & links',
			items: [
				{
					q: 'How many destinations can one link rotate between?',
					a: 'There is no hard cap. Most people run between 2 and 10 destinations per rotation, weighted however you like.'
				},
				{
					q: 'Can I change the rotation weights after a link is live?',
					a: 'Yes. Weight, order, and schedule changes apply to the next click — nothing needs to be recreated.'
				},
				{
					q: 'Does cloaking hide the destination URL from visitors?',
					a: 'Yes, the visible URL stays on your short domain throughout the redirect, regardless of which destination is served.'
				}
			]
		},
		{
			title: 'Blocking & filtering',
			items: [
				{
					q: 'What can I block traffic by?',
					a: 'IP address or range, referring domain, device type, operating system, and browser — individually or combined into one rule.'
				},
				{
					q: 'What does the Playwright check actually do?',
					a: 'It runs a lightweight automated check against the visiting client to flag headless browsers and scripted traffic before the redirect completes.'
				},
				{
					q: 'What happens to blocked traffic?',
					a: 'You choose: it can be dropped with a blank response, shown a custom page, or routed to a fallback destination.'
				}
			]
		},
		{
			title: 'Redirects',
			items: [
				{
					q: "What's the difference between a safelink page and a direct redirect?",
					a: 'A safelink page is a brief interstitial that clears the referrer before continuing; a direct redirect sends a 302 straight to the destination with no interstitial.'
				},
				{
					q: 'Does the deeplink mode require an app?',
					a: 'No — if the target app is not installed, Bitfy falls back to the web destination automatically.'
				}
			]
		},
		{
			title: 'Plan & account',
			items: [
				{
					q: 'Is Bitfy really free?',
					a: 'Yes. Rotation, blocking, source attribution, and Playwright verification are all part of the free plan, with no link limit.'
				},
				{
					q: 'How do I delete my account?',
					a: 'Contact support from the Contact page and we will remove your account, links, and click data within 30 days.'
				}
			]
		}
	];
</script>

<section class="mx-auto max-w-3xl px-5 py-20">
	<Badge variant="default">FAQ</Badge>
	<h1 class="mt-5 font-display text-4xl font-semibold text-ink dark:text-paper">
		Frequently asked questions
	</h1>
	<p class="mt-3 text-muted-foreground">
		Can't find what you need? <a href="/contact" class="font-medium text-signal hover:underline"
			>Contact us</a
		>.
	</p>

	<div class="mt-14 space-y-12">
		{#each groups as group, index (index)}
			<div>
				<h2
					class="font-display text-sm font-semibold tracking-wide text-muted-foreground uppercase"
				>
					{group.title}
				</h2>
				<div class="mt-2">
					{#each group.items as item, j (j)}
						<AppAcordion question={item.q} answer={item.a} />
					{/each}
				</div>
			</div>
		{/each}
	</div>
</section>
