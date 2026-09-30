<script lang="ts">
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { AppSidebarLayout } from '@/components/app';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import {
		ConfirmDeleteDialog,
		confirmDelete
	} from '$lib/components/ui/confirm-delete-dialog/index.js';
	import { CopyButton } from '$lib/components/ui/copy-button/index.js';
	import { StatusBadge } from '$lib/components/app/campaign/index.js';
	import { toast } from '$lib/stores/toast';
	import Icon from '@iconify/svelte';
	import type { CampaignStatus, RotationStrategy } from '$lib/schemas/campaign';
	import { CAMPAIGN_STATUSES, ROTATION_STRATEGIES } from '$lib/schemas/campaign';

	let { data } = $props();

	let campaigns = $derived(data.campaigns);
	let filter = $derived(data.filter);

	// svelte-ignore state_referenced_locally
	let searchValue = $state(filter.q ?? '');
	let searchTimeout: ReturnType<typeof setTimeout>;

	function applyFilter(patch: Record<string, string | undefined>) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		for (const [key, value] of Object.entries(patch)) {
			if (value !== undefined && value !== '') {
				params.set(key, value);
			} else {
				params.delete(key);
			}
		}
		params.delete('page'); // reset to page 1 on filter change
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}

	function onSearch(e: Event) {
		const val = (e.currentTarget as HTMLInputElement).value;
		searchValue = val;
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => applyFilter({ q: val || undefined }), 350);
	}

	function onStatusChange(e: Event) {
		const val = (e.currentTarget as HTMLSelectElement).value;
		applyFilter({ status: val || undefined });
	}

	function onStrategyChange(e: Event) {
		const val = (e.currentTarget as HTMLSelectElement).value;
		applyFilter({ strategy: val || undefined });
	}

	function onSortChange(e: Event) {
		const val = (e.currentTarget as HTMLSelectElement).value;
		applyFilter({ sort: val || undefined });
	}

	function resetFilters() {
		searchValue = '';
		goto('?', { replaceState: true });
	}

	const hasFilters = $derived(
		!!(filter.q || filter.status || filter.strategy || filter.sort !== 'created_desc')
	);

	// ── Campaign Actions ────────────────────────────────────────────
	async function postAction(action: string, formData: Record<string, string>) {
		const fd = new FormData();
		for (const [k, v] of Object.entries(formData)) fd.set(k, v);
		const res = await fetch(`?/${action}`, { method: 'POST', body: fd });
		const json = await res.json().catch(() => ({}));
		return { ok: res.ok, data: json };
	}

	function handleDelete(id: string, name: string) {
		confirmDelete({
			title: 'Delete Campaign',
			description: `Are you sure you want to delete "${name}"? This action is permanent and cannot be undone.`,
			onConfirm: async () => {
				const { ok, data } = await postAction('delete', { id });
				if (ok) {
					toast.success('Campaign deleted');
					await invalidateAll();
				} else {
					toast.error(data?.message ?? 'Failed to delete campaign');
				}
			}
		});
	}

	async function handleSetStatus(id: string, status: CampaignStatus) {
		const { ok, data } = await postAction('setStatus', { id, status });
		if (ok) {
			toast.success(`Campaign ${status === 'active' ? 'activated' : status}`);
			await invalidateAll();
		} else {
			toast.error(data?.message ?? 'Failed to update status');
		}
	}

	async function handleDuplicate(id: string, name: string) {
		const { ok, data } = await postAction('duplicate', { id });
		if (ok) {
			toast.success(`"${name}" duplicated as draft`);
			await invalidateAll();
		} else {
			toast.error(data?.message ?? 'Failed to duplicate campaign');
		}
	}

	// ── Formatting helpers ──────────────────────────────────────────
	function formatDate(d: Date | string | null | undefined): string {
		if (!d) return '—';
		const date = d instanceof Date ? d : new Date(d);
		return date.toLocaleDateString('en-US', { dateStyle: 'medium' });
	}

	function formatNumber(n: number | null | undefined): string {
		if (n == null) return '0';
		return n.toLocaleString();
	}

	const strategyLabels: Record<RotationStrategy, string> = {
		equal: 'Equal',
		percentage: 'Weighted',
		priority: 'Priority'
	};

	// ── Pagination ──────────────────────────────────────────────────
	const pageInfo = $derived(campaigns);

	function goToPage(p: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(p));
		goto(`?${params.toString()}`, { replaceState: true });
	}

	const showingFrom = $derived((pageInfo.page - 1) * pageInfo.pageSize + 1);
	const showingTo = $derived(Math.min(pageInfo.page * pageInfo.pageSize, pageInfo.total));
</script>

<AppSidebarLayout page="Links" user={data.user} setting={data.setting}>
	<div class="space-y-4 px-1 sm:px-3">
		<!-- Header -->
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-xl font-semibold">Links</h1>
				<p class="text-sm text-muted-foreground">
					{formatNumber(pageInfo.total)} campaign{pageInfo.total === 1 ? '' : 's'} total
				</p>
			</div>
			<Button href="/app/links/new" size="sm">
				<Icon icon="mingcute:add-line" class="mr-1.5 size-4" />
				New Link
			</Button>
		</div>

		<!-- Filters -->
		<div class="flex flex-wrap items-center gap-2">
			<div class="relative min-w-45 flex-1">
				<Icon
					icon="mingcute:search-line"
					class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					value={searchValue}
					oninput={onSearch}
					placeholder="Search by name or slug…"
					class="pl-8"
				/>
			</div>

			<select
				value={filter.status ?? ''}
				onchange={onStatusChange}
				class="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 dark:bg-input/30"
			>
				<option value="">All statuses</option>
				{#each CAMPAIGN_STATUSES as s, i (i)}
					<option value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
				{/each}
			</select>

			<select
				value={filter.strategy ?? ''}
				onchange={onStrategyChange}
				class="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 dark:bg-input/30"
			>
				<option value="">All strategies</option>
				{#each ROTATION_STRATEGIES as s, i (i)}
					<option value={s}>{strategyLabels[s]}</option>
				{/each}
			</select>

			<select
				value={filter.sort}
				onchange={onSortChange}
				class="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground shadow-xs outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 dark:bg-input/30"
			>
				<option value="created_desc">Newest first</option>
				<option value="created_asc">Oldest first</option>
				<option value="name_asc">Name A–Z</option>
				<option value="clicks_desc">Most clicks</option>
			</select>

			{#if hasFilters}
				<Button variant="ghost" size="sm" onclick={resetFilters}>
					<Icon icon="mingcute:close-line" class="mr-1 size-4" />
					Reset
				</Button>
			{/if}
		</div>

		<!-- Table / Empty State -->
		{#if campaigns.items.length === 0}
			<Empty.Root class="mt-6">
				<Empty.Header>
					<Icon icon="mingcute:link-2-line" class="mx-auto mb-2 size-12 text-muted-foreground" />
					<Empty.Title>No links found</Empty.Title>
					<Empty.Description>
						{#if hasFilters}
							Try adjusting your filters or <button
								type="button"
								onclick={resetFilters}
								class="underline hover:no-underline">reset them</button
							>.
						{:else}
							Create your first campaign to get started.
						{/if}
					</Empty.Description>
				</Empty.Header>
				{#if !hasFilters}
					<Button href="/app/links/new" size="sm">
						<Icon icon="mingcute:add-line" class="mr-1.5 size-4" />
						New Link
					</Button>
				{/if}
			</Empty.Root>
		{:else}
			<div class="overflow-hidden rounded-lg border border-border">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="border-b border-border bg-muted/40">
							<tr>
								<th class="px-4 py-3 text-left font-medium text-muted-foreground">Name / Slug</th>
								<th class="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
								<th
									class="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell"
									>Strategy</th
								>
								<th
									class="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell"
									>Destinations</th
								>
								<th
									class="hidden px-4 py-3 text-right font-medium text-muted-foreground sm:table-cell"
									>Clicks</th
								>
								<th
									class="hidden px-4 py-3 text-left font-medium text-muted-foreground xl:table-cell"
									>Expires</th
								>
								<th class="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each campaigns.items as item (item.id)}
								{@const shortUrl = `${page.url.origin}/${item.slug}`}
								<tr class="bg-background transition-colors hover:bg-muted/30">
									<td class="px-4 py-3">
										<div class="flex flex-col gap-0.5">
											<span class="font-medium">{item.name}</span>
											<div class="flex items-center gap-1">
												<a
													href={shortUrl}
													target="_blank"
													rel="noopener noreferrer"
													class="font-mono text-xs text-primary hover:underline"
												>
													/{item.slug}
												</a>
												<CopyButton text={shortUrl} size="icon-xs" variant="ghost" />
											</div>
										</div>
									</td>
									<td class="px-4 py-3">
										<StatusBadge status={item.status} />
									</td>
									<td class="hidden px-4 py-3 md:table-cell">
										<span class="text-muted-foreground">
											{strategyLabels[item.rotationStrategy]}
										</span>
									</td>
									<td class="hidden px-4 py-3 lg:table-cell">
										<span class="text-muted-foreground">
											{item.activeDestinationCount} / {item.destinationCount}
										</span>
									</td>
									<td class="hidden px-4 py-3 text-right sm:table-cell">
										{formatNumber(item.totalClicks)}
									</td>
									<td class="hidden px-4 py-3 xl:table-cell">
										<span class="text-muted-foreground">{formatDate(item.expiresAt)}</span>
									</td>
									<td class="px-4 py-3 text-right">
										<DropdownMenu.Root>
											<DropdownMenu.Trigger>
												{#snippet child({ props })}
													<Button variant="ghost" size="icon-sm" {...props}>
														<Icon icon="mingcute:more-2-line" class="size-4" />
														<span class="sr-only">Actions</span>
													</Button>
												{/snippet}
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="end" class="w-48">
												<DropdownMenu.Item onclick={() => navigator.clipboard.writeText(shortUrl)}>
													<Icon icon="mingcute:copy-2-line" class="mr-2 size-4" />
													Copy link
												</DropdownMenu.Item>

												<DropdownMenu.Separator />

												<DropdownMenu.Item>
													{#snippet child({ props })}
														<a href="/app/links/{item.id}/edit" {...props}>
															<Icon icon="mingcute:edit-line" class="mr-2 size-4" />
															Edit
														</a>
													{/snippet}
												</DropdownMenu.Item>

												<DropdownMenu.Item onclick={() => handleDuplicate(item.id, item.name)}>
													<Icon icon="mingcute:copy-line" class="mr-2 size-4" />
													Duplicate
												</DropdownMenu.Item>

												<DropdownMenu.Separator />

												{#if item.status === 'active'}
													<DropdownMenu.Item onclick={() => handleSetStatus(item.id, 'paused')}>
														<Icon icon="mingcute:pause-line" class="mr-2 size-4" />
														Pause
													</DropdownMenu.Item>
												{:else if item.status === 'paused' || item.status === 'draft'}
													<DropdownMenu.Item onclick={() => handleSetStatus(item.id, 'active')}>
														<Icon icon="mingcute:play-line" class="mr-2 size-4" />
														Activate
													</DropdownMenu.Item>
												{/if}

												{#if item.status !== 'archived'}
													<DropdownMenu.Item onclick={() => handleSetStatus(item.id, 'archived')}>
														<Icon icon="mingcute:archive-line" class="mr-2 size-4" />
														Archive
													</DropdownMenu.Item>
												{/if}

												<DropdownMenu.Separator />

												<DropdownMenu.Item
													class="text-destructive focus:text-destructive"
													onclick={() => handleDelete(item.id, item.name)}
												>
													<Icon icon="mingcute:delete-2-line" class="mr-2 size-4" />
													Delete
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Pagination -->
			{#if pageInfo.totalPages > 1 || pageInfo.total > pageInfo.pageSize}
				<div class="flex items-center justify-between gap-4 text-sm">
					<span class="text-muted-foreground">
						Showing {formatNumber(showingFrom)}–{formatNumber(showingTo)} of {formatNumber(
							pageInfo.total
						)}
					</span>
					<div class="flex items-center gap-1.5">
						<Button
							variant="outline"
							size="sm"
							disabled={pageInfo.page <= 1}
							onclick={() => goToPage(pageInfo.page - 1)}
						>
							<Icon icon="mingcute:arrow-left-line" class="size-4" />
							Prev
						</Button>
						<span class="px-2 font-medium">
							{pageInfo.page} / {pageInfo.totalPages}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={pageInfo.page >= pageInfo.totalPages}
							onclick={() => goToPage(pageInfo.page + 1)}
						>
							Next
							<Icon icon="mingcute:arrow-right-line" class="size-4" />
						</Button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</AppSidebarLayout>

<ConfirmDeleteDialog />
