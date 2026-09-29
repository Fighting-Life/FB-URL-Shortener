<script lang="ts">
	import { LightSwitch } from '$lib/components/ui/light-switch/index';
	import { Button } from '$lib/components/ui/button/index';
	import { Menu, X, Rocket } from '@lucide/svelte';

	let {
		user
	}: {
		user?: User | null;
	} = $props();

	let mobileOpen = $state(false);

	const links = [
		{ href: '/#features', label: 'Features' },
		{ href: '/docs', label: 'Documentation' },
		{ href: '/blog', label: 'Blog' },
		{ href: '/faq', label: 'FAQ' }
	];
</script>

<header class="sticky top-0 z-50 border-b border-border bg-sidebar backdrop-blur-md">
	<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
		<a href="/" class="flex items-center gap-2">
			<img src="/logo.png" alt="LinkShift" class="h-6 w-6 object-cover" />
			<span class="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">
				LinkShift
			</span>
		</a>

		<nav class="hidden items-center gap-8 md:flex">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="hidden items-center gap-3 md:flex">
			<LightSwitch />
			{#if user}
				<Button href="/app" variant="default" size="lg">Dashboard</Button>
			{:else}
				<Button href="/signin" variant="outline" size="lg">Sign in</Button>
				<Button href="/signup" variant="default" size="lg">
					<Rocket /> Start free</Button
				>
			{/if}
		</div>

		<div class="flex items-center gap-2 md:hidden">
			<LightSwitch />
			<Button
				variant="ghost"
				size="icon"
				aria-label="Toggle menu"
				onclick={() => (mobileOpen = !mobileOpen)}
			>
				{#if mobileOpen}<X />{:else}<Menu />{/if}
			</Button>
		</div>
	</div>

	{#if mobileOpen}
		<div class="border-t border-border px-5 py-4 md:hidden">
			<nav class="flex flex-col gap-3">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
						onclick={() => (mobileOpen = false)}
					>
						{link.label}
					</a>
				{/each}
				<div class="mt-2 flex gap-3">
					{#if user}
						<Button href="/app" variant="default" size="lg">Dashboard</Button>
					{:else}
						<Button href="/signin" variant="outline" size="lg" class="flex-1">Sign in</Button>
						<Button href="/signup" variant="default" size="lg" class="flex-1">
							<Rocket /> Start free
						</Button>
					{/if}
				</div>
			</nav>
		</div>
	{/if}
</header>
