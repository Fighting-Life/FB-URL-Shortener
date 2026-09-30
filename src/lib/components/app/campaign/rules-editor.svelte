<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import { TagsInput } from '$lib/components/ui/tags-input/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { CampaignRulesInput } from '$lib/schemas/campaign';
	import { DEVICE_TYPES, BROWSER_TYPES } from '$lib/schemas/campaign';

	let {
		rules,
		onupdate
	}: {
		rules: CampaignRulesInput;
		onupdate: (rules: CampaignRulesInput) => void;
	} = $props();

	type RuleKey = keyof CampaignRulesInput;
	type RuleMode = 'allow' | 'deny';

	function setMode(key: RuleKey, mode: RuleMode) {
		onupdate({ ...rules, [key]: { ...rules[key], mode } });
	}

	function setValues(key: RuleKey, values: string[]) {
		onupdate({ ...rules, [key]: { ...rules[key], values } });
	}

	function toggleEnum(key: 'device' | 'browser', value: string) {
		const current = rules[key].values as string[];
		const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
		onupdate({ ...rules, [key]: { ...rules[key], values: next } });
	}

	const deviceLabels: Record<string, string> = {
		mobile: 'Mobile',
		tablet: 'Tablet',
		desktop: 'Desktop',
		tv: 'TV / SmartTV',
		unknown: 'Unknown'
	};

	const browserLabels: Record<string, string> = {
		chrome: 'Chrome',
		safari: 'Safari',
		firefox: 'Firefox',
		edge: 'Edge',
		samsung: 'Samsung Browser',
		opera: 'Opera',
		facebook_in_app: 'Facebook In-App',
		instagram_in_app: 'Instagram In-App',
		other: 'Other'
	};
</script>

<div class="space-y-6">
	<!-- Geo Rule -->
	<div class="rounded-lg border border-border p-4">
		<div class="mb-3 flex items-center justify-between">
			<div>
				<h4 class="font-medium">Geographic Filter</h4>
				<p class="text-xs text-muted-foreground">
					Filter by country (ISO 3166-1 alpha-2 codes, e.g. US, GB)
				</p>
			</div>
			<div class="flex overflow-hidden rounded-md border border-border text-xs">
				<button
					type="button"
					onclick={() => setMode('geo', 'allow')}
					class="px-3 py-1.5 transition-colors {rules.geo.mode === 'allow'
						? 'bg-primary text-primary-foreground'
						: 'bg-background text-muted-foreground hover:bg-muted'}">Allow</button
				>
				<button
					type="button"
					onclick={() => setMode('geo', 'deny')}
					class="px-3 py-1.5 transition-colors {rules.geo.mode === 'deny'
						? 'bg-primary text-primary-foreground'
						: 'bg-background text-muted-foreground hover:bg-muted'}">Deny</button
				>
			</div>
		</div>
		<TagsInput
			value={rules.geo.values as string[]}
			onValueChange={(vals) => setValues('geo', vals)}
			placeholder="Add country code (e.g. US, GB)…"
		/>
		{#if rules.geo.values.length > 0}
			<p class="mt-1.5 text-xs text-muted-foreground">
				{rules.geo.mode === 'allow' ? 'Only allow' : 'Block'} visitors from: {rules.geo.values.join(
					', '
				)}
			</p>
		{:else}
			<p class="mt-1.5 text-xs text-muted-foreground">Leave empty to disable this rule</p>
		{/if}
	</div>

	<!-- IP Rule -->
	<div class="rounded-lg border border-border p-4">
		<div class="mb-3 flex items-center justify-between">
			<div>
				<h4 class="font-medium">IP Address Filter</h4>
				<p class="text-xs text-muted-foreground">
					IPv4/IPv6 addresses or CIDR ranges (e.g. 192.168.1.0/24)
				</p>
			</div>
			<div class="flex overflow-hidden rounded-md border border-border text-xs">
				<button
					type="button"
					onclick={() => setMode('ip', 'allow')}
					class="px-3 py-1.5 transition-colors {rules.ip.mode === 'allow'
						? 'bg-primary text-primary-foreground'
						: 'bg-background text-muted-foreground hover:bg-muted'}">Allow</button
				>
				<button
					type="button"
					onclick={() => setMode('ip', 'deny')}
					class="px-3 py-1.5 transition-colors {rules.ip.mode === 'deny'
						? 'bg-primary text-primary-foreground'
						: 'bg-background text-muted-foreground hover:bg-muted'}">Deny</button
				>
			</div>
		</div>
		<TagsInput
			value={rules.ip.values as string[]}
			onValueChange={(vals) => setValues('ip', vals)}
			placeholder="Add IP or CIDR…"
		/>
		{#if rules.ip.values.length === 0}
			<p class="mt-1.5 text-xs text-muted-foreground">Leave empty to disable this rule</p>
		{/if}
	</div>

	<!-- Device Rule -->
	<div class="rounded-lg border border-border p-4">
		<div class="mb-3 flex items-center justify-between">
			<div>
				<h4 class="font-medium">Device Type Filter</h4>
				<p class="text-xs text-muted-foreground">Filter by visitor device type</p>
			</div>
			<div class="flex overflow-hidden rounded-md border border-border text-xs">
				<button
					type="button"
					onclick={() => setMode('device', 'allow')}
					class="px-3 py-1.5 transition-colors {rules.device.mode === 'allow'
						? 'bg-primary text-primary-foreground'
						: 'bg-background text-muted-foreground hover:bg-muted'}">Allow</button
				>
				<button
					type="button"
					onclick={() => setMode('device', 'deny')}
					class="px-3 py-1.5 transition-colors {rules.device.mode === 'deny'
						? 'bg-primary text-primary-foreground'
						: 'bg-background text-muted-foreground hover:bg-muted'}">Deny</button
				>
			</div>
		</div>
		<div class="flex flex-wrap gap-3">
			{#each DEVICE_TYPES as device, di (di)}
				<label class="flex cursor-pointer items-center gap-2">
					<Checkbox
						checked={(rules.device.values as string[]).includes(device)}
						onCheckedChange={() => toggleEnum('device', device)}
					/>
					<span class="text-sm">{deviceLabels[device] ?? device}</span>
				</label>
			{/each}
		</div>
		{#if rules.device.values.length === 0}
			<p class="mt-1.5 text-xs text-muted-foreground">No devices selected — rule is disabled</p>
		{/if}
	</div>

	<!-- Browser Rule -->
	<div class="rounded-lg border border-border p-4">
		<div class="mb-3 flex items-center justify-between">
			<div>
				<h4 class="font-medium">Browser Filter</h4>
				<p class="text-xs text-muted-foreground">Filter by visitor browser</p>
			</div>
			<div class="flex overflow-hidden rounded-md border border-border text-xs">
				<button
					type="button"
					onclick={() => setMode('browser', 'allow')}
					class="px-3 py-1.5 transition-colors {rules.browser.mode === 'allow'
						? 'bg-primary text-primary-foreground'
						: 'bg-background text-muted-foreground hover:bg-muted'}">Allow</button
				>
				<button
					type="button"
					onclick={() => setMode('browser', 'deny')}
					class="px-3 py-1.5 transition-colors {rules.browser.mode === 'deny'
						? 'bg-primary text-primary-foreground'
						: 'bg-background text-muted-foreground hover:bg-muted'}">Deny</button
				>
			</div>
		</div>
		<div class="flex flex-wrap gap-3">
			{#each BROWSER_TYPES as browser, bi (bi)}
				<label class="flex cursor-pointer items-center gap-2">
					<Checkbox
						checked={(rules.browser.values as string[]).includes(browser)}
						onCheckedChange={() => toggleEnum('browser', browser)}
					/>
					<span class="text-sm">{browserLabels[browser] ?? browser}</span>
				</label>
			{/each}
		</div>
		{#if rules.browser.values.length === 0}
			<p class="mt-1.5 text-xs text-muted-foreground">No browsers selected — rule is disabled</p>
		{/if}
	</div>
</div>
