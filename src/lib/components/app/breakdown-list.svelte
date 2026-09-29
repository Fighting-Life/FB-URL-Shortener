<script lang="ts">
	type BreakdownItem = { label: string; value: number };
	let {
		items,
		emptyLabel = 'No traffic in this period'
	}: { items: BreakdownItem[]; emptyLabel?: string } = $props();

	const numberFormatter = new Intl.NumberFormat('en');
	const colors = [
		'oklch(0.596 0.145 163.225)',
		'oklch(0.623 0.214 259.815)',
		'oklch(0.702 0.183 293.541)',
		'oklch(0.769 0.188 70.08)',
		'oklch(0.637 0.237 25.331)',
		'oklch(0.627 0.194 149.214)'
	];
	let maximum = $derived(Math.max(1, ...items.map((item) => item.value)));
</script>

<div class="space-y-3">
	{#each items as item, index (item.label)}
		<div>
			<div class="mb-1.5 flex items-center justify-between gap-3 text-sm">
				<span class="truncate font-medium capitalize">{item.label}</span>
				<span class="text-muted-foreground tabular-nums">{numberFormatter.format(item.value)}</span>
			</div>
			<div class="h-1.5 overflow-hidden bg-muted">
				<div
					class="h-full"
					style:width={`${Math.max(2, (item.value / maximum) * 100)}%`}
					style:background-color={colors[index % colors.length]}
				></div>
			</div>
		</div>
	{:else}
		<p class="py-10 text-center text-sm text-muted-foreground">{emptyLabel}</p>
	{/each}
</div>
