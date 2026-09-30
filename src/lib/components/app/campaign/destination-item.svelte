<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import type { DestinationInput, RotationStrategy } from '$lib/schemas/campaign';
	import Icon from '@iconify/svelte';

	let {
		destination,
		index,
		strategy,
		errors,
		canRemove,
		onupdate,
		onremove
	}: {
		destination: DestinationInput;
		index: number;
		strategy: RotationStrategy;
		errors?: Record<string, string | string[] | undefined>;
		canRemove: boolean;
		onupdate: (dest: DestinationInput) => void;
		onremove: () => void;
	} = $props();

	function update(patch: Partial<DestinationInput>) {
		onupdate({ ...destination, ...patch });
	}

	function toDatetimeLocal(date: Date | null | undefined): string {
		if (!date || !(date instanceof Date)) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	function getError(field: string): string | undefined {
		if (!errors) return undefined;
		const val = errors[field];
		if (Array.isArray(val)) return val[0];
		return val;
	}
</script>

<div class="rounded-lg border border-border bg-card p-4 transition-colors">
	<div class="mb-3 flex items-center justify-between">
		<span class="text-sm font-medium text-muted-foreground">Destination {index + 1}</span>
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-1.5">
				<span class="text-xs text-muted-foreground">Active</span>
				<Switch
					checked={destination.isActive}
					onCheckedChange={(v) => update({ isActive: v })}
					size="sm"
				/>
			</div>
			{#if canRemove}
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					class="text-destructive hover:text-destructive"
					onclick={onremove}
				>
					<Icon icon="mingcute:delete-2-line" class="size-4" />
					<span class="sr-only">Remove destination</span>
				</Button>
			{/if}
		</div>
	</div>

	<div class="space-y-3">
		<!-- URL -->
		<Field.Field>
			<Field.Label>URL *</Field.Label>
			<Input
				type="url"
				value={destination.url}
				oninput={(e) => update({ url: e.currentTarget.value })}
				placeholder="https://example.com/page"
				aria-invalid={!!getError('url')}
			/>
			{#if getError('url')}
				<Field.Error>{getError('url')}</Field.Error>
			{/if}
		</Field.Field>

		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<!-- Label -->
			<Field.Field>
				<Field.Label>Label</Field.Label>
				<Input
					value={destination.label}
					oninput={(e) => update({ label: e.currentTarget.value })}
					placeholder="Optional label"
					maxlength={120}
				/>
			</Field.Field>

			<!-- Click Cap -->
			<Field.Field>
				<Field.Label>Click Cap</Field.Label>
				<Input
					type="number"
					value={destination.clickCap ?? ''}
					oninput={(e) => {
						const val = e.currentTarget.value;
						update({ clickCap: val ? parseInt(val) : null });
					}}
					placeholder="No limit"
					min={1}
				/>
			</Field.Field>
		</div>

		<!-- Weight / Priority based on strategy -->
		{#if strategy === 'percentage'}
			<Field.Field>
				<Field.Label
					>Weight (%) <span class="text-xs text-muted-foreground"
						>(active destinations must total 100)</span
					></Field.Label
				>
				<Input
					type="number"
					value={destination.weight}
					oninput={(e) => update({ weight: parseInt(e.currentTarget.value) || 0 })}
					min={0}
					max={100}
					placeholder="0"
				/>
			</Field.Field>
		{:else if strategy === 'priority'}
			<Field.Field>
				<Field.Label
					>Priority <span class="text-xs text-muted-foreground">(lower = higher priority)</span
					></Field.Label
				>
				<Input
					type="number"
					value={destination.priority}
					oninput={(e) => update({ priority: parseInt(e.currentTarget.value) || 1 })}
					min={1}
					max={1000}
					placeholder="1"
				/>
			</Field.Field>
		{/if}

		<!-- Schedule -->
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			<Field.Field>
				<Field.Label>Starts At</Field.Label>
				<Input
					type="datetime-local"
					value={toDatetimeLocal(destination.startsAt)}
					oninput={(e) => {
						const val = e.currentTarget.value;
						update({ startsAt: val ? new Date(val) : null });
					}}
				/>
			</Field.Field>
			<Field.Field>
				<Field.Label>Ends At</Field.Label>
				<Input
					type="datetime-local"
					value={toDatetimeLocal(destination.endsAt)}
					oninput={(e) => {
						const val = e.currentTarget.value;
						update({ endsAt: val ? new Date(val) : null });
					}}
				/>
				{#if getError('endsAt')}
					<Field.Error>{getError('endsAt')}</Field.Error>
				{/if}
			</Field.Field>
		</div>
	</div>
</div>
