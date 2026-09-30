<script lang="ts">
	import { AppSidebarLayout } from '@/components/app';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { CampaignForm } from '$lib/components/app/campaign/index.js';
	import Icon from '@iconify/svelte';

	let { data } = $props();
</script>

<AppSidebarLayout page="New Link" user={data.user} setting={data.setting}>
	<div class="mx-auto w-full space-y-4 px-1 sm:px-3">
		<!-- Header -->
		<div class="flex items-center gap-3">
			<Button href="/app/links" variant="ghost" size="icon-sm">
				<Icon icon="mingcute:arrow-left-line" class="size-4" />
				<span class="sr-only">Back</span>
			</Button>
			<div>
				<h1 class="text-xl font-semibold">New Link</h1>
				<p class="text-sm text-muted-foreground">Create a new campaign with smart routing</p>
			</div>
		</div>

		<!-- Form Card -->
		<Card.Root>
			<Card.Content class="pt-6">
				<CampaignForm formData={data.form} isEdit={false} />
			</Card.Content>
		</Card.Root>
	</div>
</AppSidebarLayout>
