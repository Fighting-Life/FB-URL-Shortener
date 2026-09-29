<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	type Props = (HTMLButtonAttributes | HTMLAnchorAttributes) & {
		variant?: Variant;
		size?: Size;
		href?: string;
		class?: string;
		children: Snippet;
	};

	let {
		variant = 'primary',
		size = 'md',
		href,
		class: className,
		children,
		...rest
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-paper dark:focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap';

	const variants: Record<Variant, string> = {
		primary: 'bg-ink text-paper hover:bg-ink/85 dark:bg-paper dark:text-ink dark:hover:bg-paper/90',
		secondary: 'bg-signal text-white hover:bg-signal-light',
		outline:
			'border border-line-light dark:border-line-dark bg-transparent hover:bg-paper-dim dark:hover:bg-ink-dim',
		ghost: 'bg-transparent hover:bg-paper-dim dark:hover:bg-ink-dim',
		danger: 'bg-ember text-white hover:bg-ember/90'
	};

	const sizes: Record<Size, string> = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-4 text-sm',
		lg: 'h-12 px-6 text-base'
	};

	const classes = $derived(cn(base, variants[variant], sizes[size], className));
</script>

{#if href}
	<a {href} class={classes} {...rest as HTMLAnchorAttributes}>
		{@render children()}
	</a>
{:else}
	<button class={classes} {...rest as HTMLButtonAttributes}>
		{@render children()}
	</button>
{/if}
