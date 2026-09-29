<script lang="ts">
	import { CalendarDaysIcon } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

	let { from, to }: { from: string; to: string } = $props();
</script>

<form method="GET" class="flex flex-wrap items-end gap-2">
	<label class="grid gap-1 text-xs font-medium text-muted-foreground">
		From
		<input
			name="from"
			type="date"
			value={from}
			class="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
		/>
	</label>
	<label class="grid gap-1 text-xs font-medium text-muted-foreground">
		To
		<input
			name="to"
			type="date"
			value={to}
			class="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
		/>
	</label>
	<Button type="submit" variant="outline">
		<CalendarDaysIcon data-icon="inline-start" /> Apply
	</Button>
</form>
