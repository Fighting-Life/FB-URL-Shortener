<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Variant = 'default' | 'signal' | 'ember' | 'outline';
	let {
		variant = 'default',
		class: className,
		children
	}: { variant?: Variant; class?: string; children: Snippet } = $props();

	const variants: Record<Variant, string> = {
		default: 'bg-paper-dim text-ink dark:bg-ink-dim dark:text-paper',
		signal: 'bg-signal/10 text-signal dark:bg-signal/15',
		ember: 'bg-ember/10 text-ember',
		outline: 'border border-line-light dark:border-line-dark text-slate-500'
	};
</script>

<span
	class={cn(
		'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
		variants[variant],
		className
	)}
>
	{@render children()}
</span>
