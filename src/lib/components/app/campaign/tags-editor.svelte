<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import type { TagInput } from '$lib/schemas/campaign';
	import { TAG_PROVIDERS, TAG_ID_PATTERNS } from '$lib/schemas/campaign';
	import Icon from '@iconify/svelte';

	let {
		tags,
		errors,
		onupdate
	}: {
		tags: TagInput[];
		errors?: Array<Record<string, string | string[] | undefined> | undefined>;
		onupdate: (tags: TagInput[]) => void;
	} = $props();

	const providerLabels: Record<string, string> = {
		gtag: 'Google Analytics / Tag Manager',
		fb_pixel: 'Facebook Pixel',
		tiktok_pixel: 'TikTok Pixel',
		histats: 'Histats'
	};

	function addTag() {
		onupdate([...tags, { provider: 'gtag', tagId: '', isActive: true }]);
	}

	function removeTag(index: number) {
		onupdate(tags.filter((_, i) => i !== index));
	}

	function updateTag(index: number, patch: Partial<TagInput>) {
		const next = tags.map((t, i) => (i === index ? { ...t, ...patch } : t));
		onupdate(next);
	}

	function getError(index: number, field: string): string | undefined {
		const tagErrors = errors?.[index];
		if (!tagErrors) return undefined;
		const val = tagErrors[field];
		if (Array.isArray(val)) return val[0];
		return val;
	}

	function getPlaceholder(provider: string): string {
		return TAG_ID_PATTERNS[provider as keyof typeof TAG_ID_PATTERNS]?.example ?? '';
	}
</script>

<div class="space-y-4">
	{#if tags.length === 0}
		<div class="rounded-lg border border-dashed border-border p-6 text-center">
			<Icon icon="mingcute:tag-2-line" class="mx-auto mb-2 size-8 text-muted-foreground" />
			<p class="text-sm text-muted-foreground">No analytics tags yet.</p>
			<p class="text-xs text-muted-foreground">Add tracking pixels to measure conversion.</p>
		</div>
	{/if}

	{#each tags as tag, i (i)}
		<div class="rounded-lg border border-border bg-card p-4">
			<div class="mb-3 flex items-center justify-between">
				<span class="text-sm font-medium text-muted-foreground">Tag {i + 1}</span>
				<div class="flex items-center gap-2">
					<div class="flex items-center gap-1.5">
						<span class="text-xs text-muted-foreground">Active</span>
						<Switch
							checked={tag.isActive}
							onCheckedChange={(v) => updateTag(i, { isActive: v })}
							size="sm"
						/>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						class="text-destructive hover:text-destructive"
						onclick={() => removeTag(i)}
					>
						<Icon icon="mingcute:delete-2-line" class="size-4" />
					</Button>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<Field.Field>
					<Field.Label>Provider</Field.Label>
					<Select.Root
						type="single"
						value={tag.provider}
						onValueChange={(v: string) =>
							updateTag(i, { provider: v as TagInput['provider'], tagId: '' })}
					>
						<Select.Trigger class="w-full">
							{providerLabels[tag.provider] ?? tag.provider}
						</Select.Trigger>
						<Select.Content>
							{#each TAG_PROVIDERS as provider, pi (pi)}
								<Select.Item value={provider}>{providerLabels[provider]}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</Field.Field>

				<Field.Field>
					<Field.Label>Tag ID</Field.Label>
					<Input
						value={tag.tagId}
						oninput={(e) => updateTag(i, { tagId: e.currentTarget.value })}
						placeholder={getPlaceholder(tag.provider)}
						aria-invalid={!!getError(i, 'tagId')}
					/>
					{#if getError(i, 'tagId')}
						<Field.Error>{getError(i, 'tagId')}</Field.Error>
					{/if}
				</Field.Field>
			</div>
		</div>
	{/each}

	{#if tags.length < 10}
		<Button type="button" variant="outline" size="sm" onclick={addTag} class="w-full">
			<Icon icon="mingcute:add-line" class="mr-1.5 size-4" />
			Add Analytics Tag
		</Button>
	{/if}
</div>
