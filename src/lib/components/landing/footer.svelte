<script lang="ts">
	import Logo from './app-logo.svelte';

	const columns = [
		{
			title: 'Product',
			links: [
				{ href: '/#features', label: 'Features' },
				{ href: '/#pricing', label: 'Pricing' },
				{ href: '/docs', label: 'Documentation' },
				{ href: '/faq', label: 'FAQ' }
			]
		},
		{
			title: 'Company',
			links: [
				{ href: '/about', label: 'About' },
				{ href: '/blog', label: 'Blog' },
				{ href: '/contact', label: 'Contact' }
			]
		},
		{
			title: 'Legal',
			links: [
				{ href: '/privacy', label: 'Privacy policy' },
				{ href: '/terms', label: 'Terms of service' }
			]
		}
	];
</script>

<footer class="border-t border-border bg-sidebar">
	<div class="mx-auto max-w-6xl px-5 py-14">
		<div class="grid grid-cols-2 gap-10 md:grid-cols-5">
			<div class="col-span-2">
				<Logo />
				<p class="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
					Route, mask, and control every link you share — free, with rotation and access rules built
					in.
				</p>
			</div>
			{#each columns as column, index (index)}
				<div>
					<h4 class="font-display text-sm font-semibold text-ink dark:text-paper">
						{column.title}
					</h4>
					<ul class="mt-3 space-y-2.5">
						{#each column.links as link, liIndex (liIndex)}
							<li>
								<a
									href={link.href}
									class="text-sm text-muted-foreground transition-colors hover:text-primary"
								>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
		<div
			class="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center"
		>
			<p>© {new Date().getFullYear()} LinkShift. All rights reserved.</p>
			<p class="font-mono">status: all systems routing normally</p>
		</div>
	</div>
</footer>
