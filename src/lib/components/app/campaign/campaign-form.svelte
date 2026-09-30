<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { page } from '$app/state';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { TagsInput } from '$lib/components/ui/tags-input/index.js';
	import { toast } from '$lib/stores/toast';
	import Icon from '@iconify/svelte';
	import StepIndicator from './step-indicator.svelte';
	import DestinationItem from './destination-item.svelte';
	import RulesEditor from './rules-editor.svelte';
	import TagsEditor from './tags-editor.svelte';
	import {
		CAMPAIGN_STATUSES,
		ROTATION_STRATEGIES,
		FORWARD_QUERY_MODES,
		REFERRER_MODES,
		BOT_ACTIONS,
		BLOCK_ACTIONS,
		QUERY_CONFLICTS
	} from '$lib/schemas/campaign';
	import type { SuperValidated } from 'sveltekit-superforms';
	import type { CampaignFormData, DestinationInput } from '$lib/schemas/campaign';

	let {
		formData,
		isEdit = false
	}: {
		formData: SuperValidated<CampaignFormData>;
		isEdit?: boolean;
	} = $props();

	const STEP_LABELS = ['Basic Info', 'Destinations', 'Rules', 'Tags & Settings'];
	const TOTAL_STEPS = 4;

	let currentStep = $state(1);
	let stepErrors = $state<string[]>([]);

	// svelte-ignore state_referenced_locally
	const { form, errors, enhance, submitting, message } = superForm(formData, {
		dataType: 'json',
		resetForm: false,
		onUpdate({ form: updatedForm }) {
			if (updatedForm.message) {
				toast.success(String(updatedForm.message));
			}
		},
		onResult({ result }) {
			if (result.type === 'failure') {
				const data = result.data as Record<string, unknown> | undefined;
				if (data?.message) {
					toast.error(String(data.message));
				} else if (result.data?.form) {
					// Jump to first step with errors
					const formErrors = (result.data as any)?.form?.errors ?? {};
					if (formErrors.name || formErrors.slug || formErrors.status || formErrors.expiresAt) {
						currentStep = 1;
					} else if (formErrors.destinations) {
						currentStep = 2;
					} else if (formErrors.rules) {
						currentStep = 3;
					}
					toast.error('Please fix the highlighted errors');
				}
			} else if (result.type === 'error') {
				toast.error('An unexpected error occurred');
			}
		}
	});

	// ── Step 1 client-side validation ──────────────────────────────────
	function validateStep1(): string[] {
		const errs: string[] = [];
		if (!$form.name || $form.name.trim().length < 2) {
			errs.push('Campaign name must be at least 2 characters');
		}
		if ($form.name && $form.name.trim().length > 160) {
			errs.push('Campaign name must be 160 characters or fewer');
		}
		return errs;
	}

	function validateStep2(): string[] {
		const errs: string[] = [];
		if ($form.destinations.length === 0) {
			errs.push('Add at least one destination');
		}
		const hasEmptyUrl = $form.destinations.some((d) => !d.url.trim());
		if (hasEmptyUrl) {
			errs.push('All destinations must have a valid URL');
		}
		if ($form.rotationStrategy === 'percentage') {
			const active = $form.destinations.filter((d) => d.isActive);
			if (active.length > 0) {
				const total = active.reduce((s, d) => s + (d.weight || 0), 0);
				if (total !== 100) {
					errs.push(`Active destination weights must total 100% (currently ${total}%)`);
				}
			}
		}
		return errs;
	}

	function goNext() {
		stepErrors = [];
		let errs: string[] = [];
		if (currentStep === 1) errs = validateStep1();
		else if (currentStep === 2) errs = validateStep2();

		if (errs.length > 0) {
			stepErrors = errs;
			return;
		}
		if (currentStep < TOTAL_STEPS) currentStep++;
	}

	function goPrev() {
		stepErrors = [];
		if (currentStep > 1) currentStep--;
	}

	// ── Slug helpers ──────────────────────────────────────────────────
	function sanitizeSlug(value: string): string {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9\-_]/g, '')
			.slice(0, 64);
	}

	function generateSlug() {
		const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let slug = '';
		for (let i = 0; i < 7; i++) slug += chars[Math.floor(Math.random() * chars.length)];
		$form.slug = slug;
	}

	const siteUrl = $derived(page.url.origin);

	// ── Destinations ──────────────────────────────────────────────────
	const EMPTY_DEST: DestinationInput = {
		url: '',
		label: '',
		weight: 100,
		priority: 1,
		isActive: true,
		clickCap: null,
		startsAt: null,
		endsAt: null
	};

	function addDestination() {
		$form.destinations = [...$form.destinations, { ...EMPTY_DEST }];
	}

	function removeDestination(index: number) {
		$form.destinations = $form.destinations.filter((_, i) => i !== index);
	}

	function updateDestination(index: number, dest: DestinationInput) {
		$form.destinations = $form.destinations.map((d, i) => (i === index ? dest : d));
	}

	const totalWeight = $derived(
		$form.destinations.filter((d) => d.isActive).reduce((s, d) => s + (d.weight || 0), 0)
	);

	// ── Date helpers ──────────────────────────────────────────────────
	function toDatetimeLocal(date: Date | null | undefined): string {
		if (!date || !(date instanceof Date)) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	// ── Status / Strategy labels ──────────────────────────────────────
	const statusLabels: Record<string, string> = {
		draft: 'Draft',
		active: 'Active',
		paused: 'Paused',
		archived: 'Archived'
	};

	const strategyLabels: Record<string, string> = {
		equal: 'Equal (round-robin)',
		percentage: 'Percentage-weighted',
		priority: 'Priority-based'
	};

	const forwardQueryLabels: Record<string, string> = {
		all: 'Forward all query params',
		allowlist: 'Forward specific params only',
		none: 'Strip all query params'
	};
</script>

<form method="POST" use:enhance class="space-y-6">
	<StepIndicator {currentStep} totalSteps={TOTAL_STEPS} steps={STEP_LABELS} />

	<!-- Server-side message banner -->
	{#if $message}
		<Alert.Root class="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
			<Icon icon="mingcute:check-circle-line" class="size-4 text-green-600" />
			<Alert.Title class="text-green-800 dark:text-green-300">Success</Alert.Title>
			<Alert.Description class="text-green-700 dark:text-green-400">{$message}</Alert.Description>
		</Alert.Root>
	{/if}

	<!-- Client-side step errors -->
	{#if stepErrors.length > 0}
		<Alert.Root variant="destructive">
			<Icon icon="mingcute:warning-line" class="size-4" />
			<Alert.Title>Fix before continuing</Alert.Title>
			<Alert.Description>
				<ul class="list-disc space-y-1 pl-4">
					{#each stepErrors as err}
						<li>{err}</li>
					{/each}
				</ul>
			</Alert.Description>
		</Alert.Root>
	{/if}

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- STEP 1: Basic Info                                             -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	{#if currentStep === 1}
		<div class="space-y-4">
			<h3 class="text-base font-semibold">Basic Information</h3>

			<!-- Name -->
			<Field.Field>
				<Field.Label>Campaign Name *</Field.Label>
				<Input
					bind:value={$form.name}
					name="name"
					placeholder="My awesome campaign"
					maxlength={160}
					aria-invalid={!!$errors.name}
				/>
				{#if $errors.name}
					<Field.Error>{$errors.name}</Field.Error>
				{/if}
			</Field.Field>

			<!-- Slug -->
			<Field.Field>
				<Field.Label>
					Slug
					<span class="ml-1 text-xs font-normal text-muted-foreground"
						>(leave empty to auto-generate)</span
					>
				</Field.Label>
				<div class="flex gap-2">
					<Input
						value={$form.slug}
						name="slug"
						placeholder="my-campaign"
						maxlength={64}
						oninput={(e) => {
							$form.slug = sanitizeSlug(e.currentTarget.value);
						}}
						aria-invalid={!!$errors.slug}
						class="flex-1"
					/>
					<Button type="button" variant="outline" size="sm" onclick={generateSlug}>
						<Icon icon="mingcute:refresh-1-line" class="mr-1.5 size-4" />
						Generate
					</Button>
				</div>
				{#if $form.slug}
					<p class="text-xs text-muted-foreground">
						Preview: <span class="font-mono text-foreground">{siteUrl}/{$form.slug}</span>
					</p>
				{/if}
				{#if $errors.slug}
					<Field.Error>{$errors.slug}</Field.Error>
				{/if}
			</Field.Field>

			<!-- Description -->
			<Field.Field>
				<Field.Label>Description</Field.Label>
				<Textarea
					bind:value={$form.description}
					name="description"
					placeholder="Optional description…"
					rows={3}
					maxlength={1000}
				/>
			</Field.Field>

			<!-- Status + Strategy (2 cols) -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Field.Field>
					<Field.Label>Status</Field.Label>
					<Select.Root type="single" bind:value={$form.status}>
						<Select.Trigger class="w-full">
							{statusLabels[$form.status] ?? $form.status}
						</Select.Trigger>
						<Select.Content>
							{#each CAMPAIGN_STATUSES as s}
								<Select.Item value={s}>{statusLabels[s]}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if $errors.status}
						<Field.Error>{$errors.status}</Field.Error>
					{/if}
				</Field.Field>

				<Field.Field>
					<Field.Label>Rotation Strategy</Field.Label>
					<Select.Root type="single" bind:value={$form.rotationStrategy}>
						<Select.Trigger class="w-full">
							{strategyLabels[$form.rotationStrategy] ?? $form.rotationStrategy}
						</Select.Trigger>
						<Select.Content>
							{#each ROTATION_STRATEGIES as s}
								<Select.Item value={s}>{strategyLabels[s]}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</Field.Field>
			</div>

			<!-- Expires At -->
			<Field.Field>
				<Field.Label
					>Expires At <span class="text-xs font-normal text-muted-foreground">(optional)</span
					></Field.Label
				>
				<Input
					type="datetime-local"
					value={toDatetimeLocal($form.expiresAt)}
					oninput={(e) => {
						const v = e.currentTarget.value;
						$form.expiresAt = v ? new Date(v) : null;
					}}
				/>
			</Field.Field>
		</div>
	{/if}

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- STEP 2: Destinations                                           -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	{#if currentStep === 2}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-base font-semibold">Destinations</h3>
					<p class="text-sm text-muted-foreground">
						Strategy: <strong>{strategyLabels[$form.rotationStrategy]}</strong>
					</p>
				</div>
				{#if $form.rotationStrategy === 'percentage'}
					<div class="text-right">
						<span
							class="text-sm font-semibold {totalWeight === 100
								? 'text-green-600'
								: 'text-destructive'}"
						>
							{totalWeight}% / 100%
						</span>
						{#if totalWeight !== 100}
							<p class="text-xs text-destructive">Must total 100%</p>
						{/if}
					</div>
				{/if}
			</div>

			{#if $errors.destinations && typeof $errors.destinations === 'string'}
				<Alert.Root variant="destructive">
					<Icon icon="mingcute:warning-line" class="size-4" />
					<Alert.Description>{$errors.destinations}</Alert.Description>
				</Alert.Root>
			{/if}

			<div class="space-y-3">
				{#each $form.destinations as dest, i (i)}
					<DestinationItem
						destination={dest}
						index={i}
						strategy={$form.rotationStrategy}
						errors={($errors.destinations as any)?.[i] ?? {}}
						canRemove={$form.destinations.length > 1}
						onupdate={(d) => updateDestination(i, d)}
						onremove={() => removeDestination(i)}
					/>
				{/each}
			</div>

			{#if $form.destinations.length < 50}
				<Button type="button" variant="outline" onclick={addDestination} class="w-full">
					<Icon icon="mingcute:add-line" class="mr-1.5 size-4" />
					Add Destination
				</Button>
			{/if}
		</div>
	{/if}

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- STEP 3: Rules                                                  -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	{#if currentStep === 3}
		<div class="space-y-4">
			<div>
				<h3 class="text-base font-semibold">Targeting Rules</h3>
				<p class="text-sm text-muted-foreground">Leave rules empty to allow all visitors.</p>
			</div>
			<RulesEditor
				rules={$form.rules}
				onupdate={(r) => {
					$form.rules = r;
				}}
			/>
		</div>
	{/if}

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- STEP 4: Tags & Settings                                        -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	{#if currentStep === 4}
		<div class="space-y-6">
			<!-- Analytics Tags -->
			<div>
				<h3 class="mb-3 text-base font-semibold">Analytics Tags</h3>
				<TagsEditor
					tags={$form.tags}
					errors={($errors.tags as any) ?? []}
					onupdate={(t) => {
						$form.tags = t;
					}}
				/>
			</div>

			<div class="border-t border-border pt-4">
				<h3 class="mb-3 text-base font-semibold">Redirect Settings</h3>
				<div class="space-y-4">
					<!-- Delay -->
					<Field.Field>
						<Field.Label>
							Redirect Delay (ms)
							<span class="text-xs font-normal text-muted-foreground">max 10,000</span>
						</Field.Label>
						<Input
							type="number"
							bind:value={$form.delayMs}
							min={0}
							max={10000}
							step={100}
							placeholder="0"
						/>
					</Field.Field>

					<!-- Forward Query -->
					<Field.Field>
						<Field.Label>Query Parameter Forwarding</Field.Label>
						<Select.Root type="single" bind:value={$form.forwardQuery}>
							<Select.Trigger class="w-full">
								{forwardQueryLabels[$form.forwardQuery] ?? $form.forwardQuery}
							</Select.Trigger>
							<Select.Content>
								{#each FORWARD_QUERY_MODES as mode}
									<Select.Item value={mode}>{forwardQueryLabels[mode]}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</Field.Field>

					{#if $form.forwardQuery === 'allowlist'}
						<Field.Field>
							<Field.Label>Allowed Query Parameters</Field.Label>
							<TagsInput
								value={$form.forwardQueryKeys}
								onValueChange={(vals) => {
									$form.forwardQueryKeys = vals;
								}}
								placeholder="Add param name (e.g. fbclid)…"
							/>
							{#if $errors.forwardQueryKeys?._errors?.length}
								<Field.Error>{$errors.forwardQueryKeys._errors[0]}</Field.Error>
							{/if}
						</Field.Field>
					{/if}

					<!-- Query Conflict -->
					<Field.Field>
						<Field.Label>Query Conflict Resolution</Field.Label>
						<Select.Root type="single" bind:value={$form.queryConflict}>
							<Select.Trigger class="w-full">
								{$form.queryConflict === 'destination_wins'
									? 'Destination params win'
									: 'Incoming params win'}
							</Select.Trigger>
							<Select.Content>
								{#each QUERY_CONFLICTS as c}
									<Select.Item value={c}>
										{c === 'destination_wins' ? 'Destination params win' : 'Incoming params win'}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</Field.Field>

					<!-- Referrer Mode -->
					<Field.Field orientation="horizontal">
						<Field.Content>
							<Field.Label>No-Referrer Mode</Field.Label>
							<Field.Description>Strip the Referer header on redirect</Field.Description>
						</Field.Content>
						<Switch
							checked={$form.referrerMode === 'no_referrer'}
							onCheckedChange={(v) => {
								$form.referrerMode = v ? 'no_referrer' : 'passthrough';
							}}
						/>
					</Field.Field>

					<!-- Sticky Visitor -->
					<Field.Field orientation="horizontal">
						<Field.Content>
							<Field.Label>Sticky Visitor</Field.Label>
							<Field.Description
								>Same visitor always lands on the same destination</Field.Description
							>
						</Field.Content>
						<Switch bind:checked={$form.stickyVisitor} />
					</Field.Field>

					{#if $form.stickyVisitor}
						<Field.Field>
							<Field.Label>Sticky TTL (hours)</Field.Label>
							<Input
								type="number"
								bind:value={$form.stickyTtlHours}
								min={1}
								max={720}
								placeholder="24"
							/>
						</Field.Field>
					{/if}

					<!-- Bot Action -->
					<Field.Field>
						<Field.Label>Bot Action</Field.Label>
						<Select.Root type="single" bind:value={$form.botAction}>
							<Select.Trigger class="w-full">
								{$form.botAction === 'log_only' ? 'Log only (allow through)' : 'Block bots'}
							</Select.Trigger>
							<Select.Content>
								{#each BOT_ACTIONS as a}
									<Select.Item value={a}>
										{a === 'log_only' ? 'Log only (allow through)' : 'Block bots'}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</Field.Field>

					{#if $form.botAction === 'block'}
						<Field.Field>
							<Field.Label>Block Response</Field.Label>
							<Select.Root type="single" bind:value={$form.blockAction}>
								<Select.Trigger class="w-full">
									{$form.blockAction === 'not_found' ? '404 Not Found' : '403 Forbidden'}
								</Select.Trigger>
								<Select.Content>
									{#each BLOCK_ACTIONS as a}
										<Select.Item value={a}>
											{a === 'not_found' ? '404 Not Found' : '403 Forbidden'}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Field.Field>
					{/if}
				</div>
			</div>

			<!-- OG Preview -->
			<div class="border-t border-border pt-4">
				<h3 class="mb-3 text-base font-semibold">Open Graph Preview</h3>
				<p class="mb-3 text-sm text-muted-foreground">
					Customize how this link appears when shared on social media.
				</p>
				<div class="space-y-3">
					<Field.Field>
						<Field.Label>OG Title</Field.Label>
						<Input
							bind:value={$form.ogTitle}
							placeholder="Optional custom title…"
							maxlength={200}
						/>
					</Field.Field>
					<Field.Field>
						<Field.Label>OG Description</Field.Label>
						<Textarea
							bind:value={$form.ogDescription}
							placeholder="Optional custom description…"
							rows={2}
							maxlength={500}
						/>
					</Field.Field>
					<Field.Field>
						<Field.Label>OG Image URL</Field.Label>
						<Input
							type="url"
							bind:value={$form.ogImage}
							placeholder="https://example.com/image.jpg"
							maxlength={2048}
						/>
						{#if $errors.ogImage}
							<Field.Error>{$errors.ogImage}</Field.Error>
						{/if}
					</Field.Field>
				</div>
			</div>
		</div>
	{/if}

	<!-- ── Navigation ──────────────────────────────────────────────── -->
	<div class="flex items-center justify-between border-t border-border pt-4">
		<Button type="button" variant="outline" onclick={goPrev} disabled={currentStep === 1}>
			<Icon icon="mingcute:arrow-left-line" class="mr-1.5 size-4" />
			Previous
		</Button>

		<span class="text-xs text-muted-foreground">Step {currentStep} of {TOTAL_STEPS}</span>

		{#if currentStep < TOTAL_STEPS}
			<Button type="button" onclick={goNext}>
				Next
				<Icon icon="mingcute:arrow-right-line" class="ml-1.5 size-4" />
			</Button>
		{:else}
			<Button type="submit" disabled={$submitting}>
				{#if $submitting}
					<Spinner class="mr-1.5 size-4" />
				{/if}
				{$submitting ? 'Saving…' : isEdit ? 'Update Campaign' : 'Create Campaign'}
			</Button>
		{/if}
	</div>
</form>
