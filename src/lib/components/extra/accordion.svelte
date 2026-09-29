<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	let {
		question,
		answer,
		open = $bindable(false)
	}: { question: string; answer: string; open?: boolean } = $props();
</script>

<div class="border-b border-line-light dark:border-line-dark">
	<button
		onclick={() => (open = !open)}
		class="flex w-full items-center justify-between gap-4 py-5 text-left"
		aria-expanded={open}
	>
		<span class="font-display text-base font-medium text-ink dark:text-paper">{question}</span>
		<ChevronDown
			size={18}
			class={`shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
		/>
	</button>
	{#if open}
		<p class="pr-8 pb-5 text-sm leading-relaxed text-slate-500">{answer}</p>
	{/if}
</div>
