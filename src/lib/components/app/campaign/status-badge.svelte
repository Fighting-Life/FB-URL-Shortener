<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { CampaignStatus } from '$lib/schemas/campaign';

	let {
		status,
		class: className
	}: {
		status: CampaignStatus;
		class?: string;
	} = $props();

	const variantClasses: Record<CampaignStatus, string> = {
		active:
			'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
		paused:
			'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
		draft: 'bg-muted text-muted-foreground border border-border',
		archived:
			'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
	};

	const labels: Record<CampaignStatus, string> = {
		active: 'Active',
		paused: 'Paused',
		draft: 'Draft',
		archived: 'Archived'
	};
</script>

<span
	class={cn(
		'inline-flex h-5 items-center rounded-full px-2 py-0.5 text-xs font-medium',
		variantClasses[status],
		className
	)}
>
	{labels[status]}
</span>
