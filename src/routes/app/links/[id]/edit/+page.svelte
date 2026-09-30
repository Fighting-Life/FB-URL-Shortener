<script lang="ts">
	import { AppSidebarLayout } from '@/components/app';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { CampaignForm } from '$lib/components/app/campaign/index.js';
	import { CopyButton } from '$lib/components/ui/copy-button/index.js';
	import { page } from '$app/state';
	import Icon from '@iconify/svelte';

	let { data } = $props();

	const campaign = $derived(data.campaign);
	const shortUrl = $derived(`${page.url.origin}/${campaign.slug}`);
</script>

<AppSidebarLayout page="Edit Link" user={data.user} setting={data.setting}>
	<div class="mx-auto w-full space-y-4 px-1 sm:px-3">
		<!-- Header -->
		<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
			<div class="flex items-center gap-3">
				<Button href="/app/links" variant="ghost" size="icon-sm">
					<Icon icon="mingcute:arrow-left-line" class="size-4" />
					<span class="sr-only">Back</span>
				</Button>
				<div>
					<h1 class="text-xl font-semibold">Edit Campaign</h1>
					<p class="text-sm text-muted-foreground">{campaign.name}</p>
				</div>
			</div>
			<div class="flex items-center gap-2 pl-10 sm:pl-0">
				<a
					href={shortUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="font-mono text-xs text-primary hover:underline"
				>
					{shortUrl}
				</a>
				<CopyButton text={shortUrl} size="icon-xs" variant="outline" />
			</div>
		</div>

		<!-- Stats row -->
		<div class="flex gap-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
			<div class="flex flex-col gap-0.5">
				<span class="text-xs text-muted-foreground">Total Clicks</span>
				<span class="font-semibold">{campaign.totalClicks.toLocaleString()}</span>
			</div>
			<div class="h-8 w-px bg-border"></div>
			<div class="flex flex-col gap-0.5">
				<span class="text-xs text-muted-foreground">Destinations</span>
				<span class="font-semibold">{campaign.destinations.length}</span>
			</div>
			<div class="h-8 w-px bg-border"></div>
			<div class="flex flex-col gap-0.5">
				<span class="text-xs text-muted-foreground">Created</span>
				<span class="font-semibold">
					{new Date(campaign.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
				</span>
			</div>
		</div>

		<!-- Form Card -->
		<Card.Root>
			<Card.Content class="pt-6">
				<CampaignForm formData={data.form} isEdit={true} />
			</Card.Content>
		</Card.Root>
	</div>
</AppSidebarLayout>
