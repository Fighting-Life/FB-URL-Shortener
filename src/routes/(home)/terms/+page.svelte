<script lang="ts">
	const sections = [
		{
			id: 'acceptance',
			title: '1. Acceptance of terms',
			body: `By creating a Bitfy account or routing traffic through a Bitfy link, you agree to
			these terms. If you're using Bitfy on behalf of an organization, you're confirming you have
			authority to bind that organization to them.`
		},
		{
			id: 'acceptable-use',
			title: '2. Acceptable use',
			body: `Links may not be used to distribute malware, run phishing pages, evade platform bans
			through cloaking of illegal content, or route traffic to destinations that violate applicable
			law. We reserve the right to disable any link found to violate this policy without notice.`
		},
		{
			id: 'rotation-and-blocking-rules',
			title: '3. Rotation and blocking rules',
			body: `You are responsible for the destinations you add to a rotation and for the accuracy of
			any blocking rules you configure. Bitfy is not liable for traffic lost due to
			misconfigured rules.`
		},
		{
			id: 'the-free-plan',
			title: '4. The free plan',
			body: `The free plan includes unlimited links, rotation, blocking rules, and Playwright
			verification at no cost. We may introduce paid tiers with additional capacity in the future,
			but will not remove features from the free plan retroactively without advance notice.`
		},
		{
			id: 'availability',
			title: '5. Availability',
			body: `We target high availability for redirect serving but do not guarantee uninterrupted
			service. Scheduled maintenance windows will be posted to our status page in advance where
			possible.`
		},
		{
			id: 'termination',
			title: '6. Termination',
			body: `You may delete your account at any time. We may suspend or terminate accounts that
			violate acceptable use, with notice where the violation isn't severe enough to warrant
			immediate action.`
		},
		{
			id: 'liability',
			title: '7. Limitation of liability',
			body: `Bitfy is provided as-is. To the extent permitted by law, we are not liable for
			indirect or consequential damages arising from use of the service, including lost traffic or
			revenue from misrouted links.`
		}
	];
</script>

<section class="mx-auto max-w-5xl px-5 py-20">
	<h1 class="font-display text-4xl font-semibold text-ink dark:text-paper">Terms of Service</h1>
	<p class="mt-3 text-sm text-muted-foreground">Effective date: January 1, 2026</p>

	<div class="mt-14 grid gap-12 lg:grid-cols-[220px_1fr]">
		<nav class="hidden lg:block">
			<ul class="sticky top-24 space-y-3 text-sm">
				{#each sections as s, si (si)}
					<li>
						<a href={`#${s.id}`} class="text-muted-foreground hover:text-ink dark:hover:text-paper"
							>{s.title}</a
						>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="max-w-2xl space-y-12">
			<p class="text-sm leading-relaxed text-muted-foreground">
				These terms govern your use of Bitfy's link rotation, cloaking, and redirect-routing
				service.
			</p>
			{#each sections as s, si (si)}
				<div id={s.id}>
					<h2 class="font-display text-xl font-semibold text-ink dark:text-paper">{s.title}</h2>
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
