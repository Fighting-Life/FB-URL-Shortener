<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children,
		...rest
	}: { class?: string; children: Snippet; [key: string]: unknown } = $props();
</script>

<div
	class={cn(
		'rounded-xl border border-line-light bg-white dark:border-line-dark dark:bg-ink-dim',
		className
	)}
	{...rest}
>
	{@render children()}
</div>
