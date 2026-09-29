<script lang="ts">
	import { LineChart } from 'layerchart';

	type TimelinePoint = { day: string; clicks: number; delivered: number; blocked: number };
	let { data }: { data: TimelinePoint[] } = $props();

	const numberFormatter = new Intl.NumberFormat('en');
	const shortDate = new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	});
	const series = [
		{
			key: 'delivered',
			label: 'Delivered',
			value: 'delivered',
			color: 'oklch(0.596 0.145 163.225)'
		},
		{
			key: 'blocked',
			label: 'Blocked',
			value: 'blocked',
			color: 'oklch(0.637 0.237 25.331)'
		}
	];
	let maximum = $derived(Math.max(1, ...data.map((point) => point.delivered + point.blocked)));
</script>

<div class="h-72 w-full">
	<LineChart
		{data}
		x="day"
		y={['delivered', 'blocked']}
		{series}
		height={288}
		yDomain={[0, maximum]}
		yNice={true}
		axis="y"
		grid={true}
		points={{ radius: 2.5 }}
		padding={{ top: 14, right: 14, bottom: 12, left: 44 }}
		props={{ spline: { strokeWidth: 2.25 }, grid: { opacity: 0.16 } }}
	>
		{#snippet tooltip({ context })}
			{@const point = context.tooltip.data as TimelinePoint | undefined}
			{#if point}
				<div
					class="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
				>
					<p class="mb-1.5 font-medium">{shortDate.format(new Date(`${point.day}T00:00:00Z`))}</p>
					<p class="text-emerald-600">Delivered: {numberFormatter.format(point.delivered)}</p>
					<p class="text-destructive">Blocked: {numberFormatter.format(point.blocked)}</p>
				</div>
			{/if}
		{/snippet}
	</LineChart>
</div>
<div class="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
	<span>{data[0]?.day ?? ''}</span>
	<div class="flex items-center gap-4">
		<span class="inline-flex items-center gap-1.5"
			><i class="size-2 bg-emerald-600"></i>Delivered</span
		>
		<span class="inline-flex items-center gap-1.5"
			><i class="size-2 bg-destructive"></i>Blocked</span
		>
	</div>
	<span>{data.at(-1)?.day ?? ''}</span>
</div>
