<script lang="ts">
	const sections = [
		{
			id: 'data-we-collect',
			title: '1. Data we collect',
			body: `We collect the information you give us directly — your name, email, and password hash when
			you create an account — and information generated as your links are used: click timestamps,
			the requesting IP address, user agent, referrer, and the destination a click was routed to.
			We do not collect the content of the pages your destinations serve.`
		},
		{
			id: 'why-we-collect-it',
			title: '2. Why we collect it',
			body: `Click-level data is what powers rotation, blocking rules, and Playwright-based
			verification — without it, the product cannot route traffic. We also use aggregated,
			de-identified click data to monitor abuse across the platform.`
		},
		{
			id: 'blocking-rules-and-third-party-data',
			title: '3. Blocking rules and third-party data',
			body: `When you configure IP, domain, device, or browser blocking, those rules are evaluated
			against each incoming request in real time. We do not sell or share individual visitor data
			with third parties for advertising purposes.`
		},
		{
			id: 'retention',
			title: '4. Data retention',
			body: `Click logs are retained for 90 days by default and are then aggregated into summary
			statistics. Account data is retained until you delete your account, after which it is removed
			within 30 days.`
		},
		{
			id: 'your-rights',
			title: '5. Your rights',
			body: `You can export or delete your click history from your dashboard at any time, and you can
			request full account deletion by contacting support. Deletion removes your links, rules, and
			associated click data.`
		},
		{
			id: 'security',
			title: '6. Security',
			body: `Passwords are hashed, not stored in plain text. Access to raw click logs is limited to
			systems that need it to serve redirects and to a small number of engineers investigating abuse
			reports.`
		},
		{
			id: 'changes',
			title: '7. Changes to this policy',
			body: `If we make a material change to how we handle data, we'll email account holders and post
			an update here with a new effective date.`
		}
	];
</script>

<section class="mx-auto max-w-5xl px-5 py-20">
	<h1 class="font-display text-4xl font-semibold text-ink dark:text-paper">Privacy Policy</h1>
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
				This policy explains what Bitfy collects when you shorten, rotate, and route links, and how
				that data is used to run the service.
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
