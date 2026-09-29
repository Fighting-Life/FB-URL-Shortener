<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import {
		ArrowLeftIcon,
		ExternalLinkIcon,
		PlusIcon,
		SaveIcon,
		SmartphoneIcon,
		Trash2Icon
	} from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select/index.js';

	type Destination = {
		id?: string;
		name: string;
		url: string;
		type: 'affiliate' | 'cpa' | 'direct' | 'popunder';
		platform: 'generic' | 'amazon' | 'ebay' | 'shopee' | 'tiktok' | 'traveloka' | 'custom';
		enabled: boolean;
		weight: number;
		priority: number;
		geoMode: 'all' | 'include' | 'exclude';
		countries: string;
		deepLink: {
			enabled: boolean;
			androidScheme: string;
			androidPackageName: string;
			androidStoreUrl: string;
			iosScheme: string;
			iosAppId: string;
			iosStoreUrl: string;
			universalLink: string;
			webFallbackUrl: string;
		};
	};

	type Campaign = {
		id: string;
		teamId: string | null;
		name: string;
		slug: string;
		description: string | null;
		status: 'draft' | 'active' | 'paused' | 'archived';
		redirectType: 'direct' | 'safelink' | 'deeplink';
		rotationStrategy: 'equal' | 'percentage' | 'priority';
		fallbackUrl: string | null;
		botProtectionEnabled: boolean;
		trackingEnabled: boolean;
		preserveQueryParams: boolean;
		stripReferrer: boolean;
		attributionEnabled: boolean;
		attributionSource: string | null;
		attributionMedium: string | null;
		attributionCampaign: string | null;
		popunderSetting: {
			enabled: boolean;
			targetUrl: string;
			behavior: 'background' | 'new_tab' | 'same_tab';
			delayMs: number;
			frequencyCap: number;
			frequencyWindowHours: number;
			browserRules: Record<string, unknown>;
		} | null;
		destinations: Array<{
			id: string;
			name: string;
			url: string;
			type: Destination['type'];
			platform: Destination['platform'];
			enabled: boolean;
			weight: number;
			priority: number;
			geoMode: Destination['geoMode'];
			geoTargets: Array<{ countryCode: string }>;
			deepLink: {
				androidScheme: string | null;
				androidPackageName: string | null;
				androidStoreUrl: string | null;
				iosScheme: string | null;
				iosAppId: string | null;
				iosStoreUrl: string | null;
				universalLink: string | null;
				webFallbackUrl: string | null;
			} | null;
		}>;
	};

	let {
		campaign,
		form,
		submitLabel = 'Create campaign',
		teams = []
	}: {
		campaign?: Campaign;
		form?: { error?: string; validation?: { formErrors?: string[] } } | null;
		submitLabel?: string;
		teams?: Array<{ id: string; name: string; role: string }>;
	} = $props();

	function blankDestination(): Destination {
		return {
			name: '',
			url: '',
			type: 'affiliate',
			platform: 'generic',
			enabled: true,
			weight: 100,
			priority: 0,
			geoMode: 'all',
			countries: '',
			deepLink: {
				enabled: false,
				androidScheme: '',
				androidPackageName: '',
				androidStoreUrl: '',
				iosScheme: '',
				iosAppId: '',
				iosStoreUrl: '',
				universalLink: '',
				webFallbackUrl: ''
			}
		};
	}

	let destinations = $state<Destination[]>(
		untrack(() => campaign)?.destinations.map((destination) => ({
			id: destination.id,
			name: destination.name,
			url: destination.url,
			type: destination.type,
			platform: destination.platform,
			enabled: destination.enabled,
			weight: destination.weight,
			priority: destination.priority,
			geoMode: destination.geoMode,
			countries: destination.geoTargets.map((target) => target.countryCode).join(', '),
			deepLink: {
				enabled: Boolean(destination.deepLink),
				androidScheme: destination.deepLink?.androidScheme ?? '',
				androidPackageName: destination.deepLink?.androidPackageName ?? '',
				androidStoreUrl: destination.deepLink?.androidStoreUrl ?? '',
				iosScheme: destination.deepLink?.iosScheme ?? '',
				iosAppId: destination.deepLink?.iosAppId ?? '',
				iosStoreUrl: destination.deepLink?.iosStoreUrl ?? '',
				universalLink: destination.deepLink?.universalLink ?? '',
				webFallbackUrl: destination.deepLink?.webFallbackUrl ?? ''
			}
		})) ?? [blankDestination()]
	);
	let rotationStrategy = $state<Campaign['rotationStrategy']>(
		untrack(() => campaign)?.rotationStrategy ?? 'equal'
	);
	let redirectType = $state<Campaign['redirectType']>(
		untrack(() => campaign)?.redirectType ?? 'direct'
	);
	type PopunderBehavior = 'background' | 'new_tab' | 'same_tab';
	type BrowserBehavior = 'inherit' | 'disabled' | PopunderBehavior;
	const storedBrowserRules = untrack(() => campaign)?.popunderSetting?.browserRules ?? {};
	const browserBehavior = (key: string, fallback: BrowserBehavior): BrowserBehavior => {
		const value = storedBrowserRules[key];
		return ['inherit', 'disabled', 'background', 'new_tab', 'same_tab'].includes(String(value))
			? (value as BrowserBehavior)
			: fallback;
	};
	let popunderEnabled = $state(untrack(() => campaign)?.popunderSetting?.enabled ?? false);
	let popunderBehavior = $state<PopunderBehavior>(
		untrack(() => campaign)?.popunderSetting?.behavior ?? 'background'
	);
	let popunderDesktopBehavior = $state<BrowserBehavior>(browserBehavior('desktop', 'inherit'));
	let popunderMobileBehavior = $state<BrowserBehavior>(browserBehavior('mobile', 'inherit'));
	let popunderWebviewBehavior = $state<BrowserBehavior>(browserBehavior('webview', 'same_tab'));
	let attributionEnabled = $state(untrack(() => campaign)?.attributionEnabled ?? false);
	let submitting = $state(false);

	const selectClass =
		'border-input bg-background focus:border-ring focus:ring-ring/30 h-9 w-full rounded-md border px-2.5 text-sm outline-none focus:ring-3 capitalize';
	const behaviorOptions: Array<[string, string, boolean]> = untrack(() => [
		['trackingEnabled', 'Track analytics', campaign?.trackingEnabled ?? true],
		['botProtectionEnabled', 'Enable bot protection', campaign?.botProtectionEnabled ?? true],
		['preserveQueryParams', 'Forward query parameters', campaign?.preserveQueryParams ?? true],
		['stripReferrer', 'Strip referrer', campaign?.stripReferrer ?? false]
	]);

	function addDestination() {
		destinations.push(blankDestination());
	}

	function removeDestination(index: number) {
		if (destinations.length === 1) return;
		destinations.splice(index, 1);
	}
</script>

<form
	method="POST"
	class="mx-auto w-full space-y-6"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
>
	{#if form?.error}
		<div
			class="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			role="alert"
		>
			<p class="font-medium">{form.error}</p>
			{#each form.validation?.formErrors ?? [] as message, i (i)}
				<p class="mt-1">{message}</p>
			{/each}
		</div>
	{/if}

	<section class="border-b border-border pb-6">
		<div class="mb-5">
			<h2 class="text-base font-semibold">Campaign details</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Name the campaign and configure its public short URL.
			</p>
		</div>
		<div class="grid gap-5 md:grid-cols-2">
			<div class="space-y-2">
				<Label for="teamId">Ownership</Label>
				<select id="teamId" name="teamId" class={selectClass} value={campaign?.teamId ?? ''}>
					<option value="">Personal</option>
					{#each teams as team (team.id)}<option value={team.id}>{team.name} ({team.role})</option
						>{/each}
				</select>
			</div>
			<div class="space-y-2">
				<Label for="name">Campaign name</Label>
				<Input
					id="name"
					name="name"
					required
					maxlength={160}
					value={campaign?.name ?? ''}
					placeholder="Indonesia marketplace offers"
				/>
			</div>
			<div class="space-y-2">
				<Label for="slug">Custom slug</Label>
				<Input
					id="slug"
					name="slug"
					minlength={3}
					maxlength={64}
					value={campaign?.slug ?? ''}
					placeholder="Leave blank to generate automatically"
				/>
			</div>
			<div class="space-y-2 md:col-span-2">
				<Label for="description">Description</Label>
				<Textarea
					id="description"
					name="description"
					maxlength={1000}
					value={campaign?.description ?? ''}
					placeholder="Internal notes for your team"
				/>
			</div>
			<div class="space-y-2">
				<Label for="status">Status</Label>
				<select id="status" name="status" class={selectClass} value={campaign?.status ?? 'draft'}>
					{#each ['draft', 'active', 'paused', 'archived'] as status (status)}
						<option value={status}>{status}</option>
					{/each}
				</select>
			</div>
			<div class="space-y-2">
				<Label for="redirectType">Redirect type</Label>
				<select id="redirectType" name="redirectType" class={selectClass} bind:value={redirectType}>
					{#each ['direct', 'deeplink', 'safelink'] as redirectType (redirectType)}
						<option value={redirectType}>{redirectType}</option>
					{/each}
				</select>
			</div>
			<div class="space-y-2">
				<Label for="rotationStrategy">Rotation strategy</Label>
				<select
					id="rotationStrategy"
					name="rotationStrategy"
					class={selectClass}
					bind:value={rotationStrategy}
				>
					<option value="equal">Equal</option>
					<option value="percentage">Percentage</option>
					<option value="priority">Priority</option>
				</select>
			</div>
			<div class="space-y-2">
				<Label for="fallbackUrl">Fallback URL</Label>
				<Input
					id="fallbackUrl"
					name="fallbackUrl"
					type="url"
					value={campaign?.fallbackUrl ?? ''}
					placeholder="https://example.com/unavailable"
				/>
			</div>
		</div>
	</section>

	<section class="border-b border-border pb-6">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-base font-semibold">Source attribution</h2>
				<p class="mt-1 text-sm text-muted-foreground">UTM attribution for destination analytics.</p>
			</div>
			<label class="flex items-center gap-2 text-sm font-medium">
				<input
					type="checkbox"
					name="attributionEnabled"
					bind:checked={attributionEnabled}
					class="size-4"
				/>
				Enabled
			</label>
		</div>
		<div class="grid gap-4 md:grid-cols-3">
			<div class="space-y-2">
				<Label for="attributionSource">Source</Label>
				<Input
					id="attributionSource"
					name="attributionSource"
					list="attribution-source-options"
					maxlength={100}
					required={attributionEnabled}
					disabled={!attributionEnabled}
					value={campaign?.attributionSource ?? ''}
					placeholder="google"
				/>
				<datalist id="attribution-source-options">
					<option value="google"></option>
					<option value="facebook"></option>
					<option value="instagram"></option>
					<option value="tiktok"></option>
					<option value="twitter"></option>
					<option value="email"></option>
				</datalist>
			</div>
			<div class="space-y-2">
				<Label for="attributionMedium">Medium</Label>
				<Input
					id="attributionMedium"
					name="attributionMedium"
					maxlength={100}
					disabled={!attributionEnabled}
					value={campaign?.attributionMedium ?? ''}
					placeholder="paid_social"
				/>
			</div>
			<div class="space-y-2">
				<Label for="attributionCampaign">Campaign</Label>
				<Input
					id="attributionCampaign"
					name="attributionCampaign"
					maxlength={200}
					disabled={!attributionEnabled}
					value={campaign?.attributionCampaign ?? ''}
					placeholder="launch_2026"
				/>
			</div>
		</div>
	</section>

	<section class="border-b border-border pb-6">
		<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="flex items-center gap-2 text-base font-semibold">
					<ExternalLinkIcon class="size-4" /> Popunder delivery
				</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Open a secondary URL from a visitor-confirmed click.
				</p>
			</div>
			<label class="flex items-center gap-2 text-sm font-medium">
				<input
					type="checkbox"
					name="popunderEnabled"
					bind:checked={popunderEnabled}
					class="size-4"
				/>
				Enable popunder
			</label>
		</div>

		<div class="grid gap-4 md:grid-cols-2" class:opacity-60={!popunderEnabled}>
			<div class="space-y-2 md:col-span-2">
				<Label for="popunderTargetUrl">Second target URL</Label>
				<Input
					id="popunderTargetUrl"
					name="popunderTargetUrl"
					type="url"
					required={popunderEnabled}
					value={campaign?.popunderSetting?.targetUrl ?? ''}
					placeholder="https://example.com/second-offer"
				/>
			</div>
			<div class="space-y-2">
				<Label for="popunderBehavior">Default behavior</Label>
				<select
					id="popunderBehavior"
					name="popunderBehavior"
					class={selectClass}
					bind:value={popunderBehavior}
				>
					<option value="background">Second target in background tab</option>
					<option value="new_tab">Second target in new tab</option>
					<option value="same_tab">Show second target when visitor returns</option>
				</select>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-2">
					<Label for="popunderDelayMs">Delay (ms)</Label>
					<Input
						id="popunderDelayMs"
						name="popunderDelayMs"
						type="number"
						min="0"
						max="10000"
						value={campaign?.popunderSetting?.delayMs ?? 0}
					/>
				</div>
				<div class="space-y-2">
					<Label for="popunderFrequencyCap">Max displays</Label>
					<Input
						id="popunderFrequencyCap"
						name="popunderFrequencyCap"
						type="number"
						min="1"
						max="100"
						value={campaign?.popunderSetting?.frequencyCap ?? 1}
					/>
				</div>
			</div>
			<div class="space-y-2">
				<Label for="popunderFrequencyWindowHours">Frequency window (hours)</Label>
				<Input
					id="popunderFrequencyWindowHours"
					name="popunderFrequencyWindowHours"
					type="number"
					min="1"
					max="720"
					value={campaign?.popunderSetting?.frequencyWindowHours ?? 24}
				/>
			</div>
			<div></div>

			<div class="space-y-2">
				<Label for="popunderDesktopBehavior">Desktop behavior</Label>
				<select
					id="popunderDesktopBehavior"
					name="popunderDesktopBehavior"
					class={selectClass}
					bind:value={popunderDesktopBehavior}
				>
					<option value="inherit">Use default</option>
					<option value="disabled">Disabled</option>
					<option value="background">Background tab</option>
					<option value="new_tab">New tab</option>
					<option value="same_tab">On browser back</option>
				</select>
			</div>
			<div class="space-y-2">
				<Label for="popunderMobileBehavior">Mobile behavior</Label>
				<select
					id="popunderMobileBehavior"
					name="popunderMobileBehavior"
					class={selectClass}
					bind:value={popunderMobileBehavior}
				>
					<option value="inherit">Use default</option>
					<option value="disabled">Disabled</option>
					<option value="background">Background tab</option>
					<option value="new_tab">New tab</option>
					<option value="same_tab">On browser back</option>
				</select>
			</div>
			<div class="space-y-2">
				<Label for="popunderWebviewBehavior">Social WebView behavior</Label>
				<select
					id="popunderWebviewBehavior"
					name="popunderWebviewBehavior"
					class={selectClass}
					bind:value={popunderWebviewBehavior}
				>
					<option value="inherit">Use default</option>
					<option value="disabled">Disabled</option>
					<option value="background">Background tab</option>
					<option value="new_tab">New tab</option>
					<option value="same_tab">On browser back</option>
				</select>
			</div>
		</div>
	</section>

	<section class="border-b border-border pb-6">
		<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h2 class="text-base font-semibold">Destinations</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Traffic will be assigned across these active URLs.
				</p>
			</div>
			<Button type="button" variant="outline" onclick={addDestination}>
				<PlusIcon data-icon="inline-start" /> Add destination
			</Button>
		</div>

		<div class="space-y-4">
			{#each destinations as destination, index (destination.id ?? index)}
				<div class="rounded-md border border-border bg-card p-4">
					<input type="hidden" name="destinationId" value={destination.id ?? ''} />
					<div class="mb-4 flex items-center justify-between gap-3">
						<div class="flex items-center gap-3">
							<span
								class="flex size-7 items-center justify-center rounded bg-muted text-xs font-semibold"
								>{index + 1}</span
							>
							<label class="flex items-center gap-2 text-sm font-medium">
								<input
									type="checkbox"
									name="destinationEnabled"
									value={index}
									bind:checked={destination.enabled}
									class="size-4"
								/>
								Enabled
							</label>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							disabled={destinations.length === 1}
							onclick={() => removeDestination(index)}
							aria-label="Remove destination"
							title="Remove destination"
						>
							<Trash2Icon />
						</Button>
					</div>

					<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<div class="space-y-2 lg:col-span-2">
							<Label for="destination-name-{index}">Name</Label>
							<Input
								id="destination-name-{index}"
								name="destinationName"
								required
								maxlength={160}
								bind:value={destination.name}
								placeholder="Shopee mobile offer"
							/>
						</div>
						<div class="space-y-2">
							<Label for="destination-type-{index}">Offer type</Label>
							<select
								id="destination-type-{index}"
								name="destinationType"
								class={selectClass}
								bind:value={destination.type}
							>
								<option value="affiliate">Affiliate</option>
								<option value="cpa">CPA offer</option>
								<option value="direct">Direct</option>
								<option value="popunder">Popunder</option>
							</select>
						</div>
						<div class="space-y-2">
							<Label for="destination-platform-{index}">Platform</Label>
							<select
								id="destination-platform-{index}"
								name="destinationPlatform"
								class={selectClass}
								bind:value={destination.platform}
							>
								<option value="generic">Generic</option>
								<option value="amazon">Amazon</option>
								<option value="ebay">eBay</option>
								<option value="shopee">Shopee</option>
								<option value="tiktok">TikTok</option>
								<option value="traveloka">Traveloka</option>
								<option value="custom">Custom</option>
							</select>
						</div>
						<div class="space-y-2 md:col-span-2 lg:col-span-4">
							<Label for="destination-url-{index}">Destination URL</Label>
							<Input
								id="destination-url-{index}"
								name="destinationUrl"
								type="url"
								required
								bind:value={destination.url}
								placeholder="https://..."
							/>
						</div>
						<div class="space-y-2">
							<Label for="destination-weight-{index}"
								>{rotationStrategy === 'percentage' ? 'Percentage' : 'Weight'}</Label
							>
							<Input
								id="destination-weight-{index}"
								name="destinationWeight"
								type="number"
								min="1"
								max="10000"
								bind:value={destination.weight}
							/>
						</div>
						<div class="space-y-2">
							<Label for="destination-priority-{index}">Priority</Label>
							<Input
								id="destination-priority-{index}"
								name="destinationPriority"
								type="number"
								min="0"
								max="10000"
								bind:value={destination.priority}
							/>
						</div>
						<div class="space-y-2">
							<Label for="destination-geo-{index}">Geo targeting</Label>
							<select
								id="destination-geo-{index}"
								name="destinationGeoMode"
								class={selectClass}
								bind:value={destination.geoMode}
							>
								<option value="all">All countries</option>
								<option value="include">Only selected</option>
								<option value="exclude">Exclude selected</option>
							</select>
						</div>
						<div class="space-y-2">
							<Label for="destination-countries-{index}">Country codes</Label>
							<Input
								id="destination-countries-{index}"
								name="destinationCountries"
								readonly={destination.geoMode === 'all'}
								bind:value={destination.countries}
								placeholder="ID, SG, MY"
							/>
						</div>
					</div>

					<div
						class:hidden={redirectType !== 'deeplink'}
						class="mt-5 border-t border-border pt-5"
						aria-hidden={redirectType !== 'deeplink'}
					>
						<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
							<div>
								<h3 class="flex items-center gap-2 text-sm font-semibold">
									<SmartphoneIcon class="size-4" /> App deeplink
								</h3>
								<p class="mt-1 text-xs text-muted-foreground">
									App launch falls back to the store or destination URL.
								</p>
							</div>
							<label class="flex items-center gap-2 text-sm font-medium">
								<input
									type="checkbox"
									name="destinationDeepLinkEnabled"
									value={index}
									bind:checked={destination.deepLink.enabled}
									class="size-4"
								/>
								Enable
							</label>
						</div>

						<div class="grid gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label for="destination-android-scheme-{index}">Android app URL</Label>
								<Input
									id="destination-android-scheme-{index}"
									name="destinationAndroidScheme"
									bind:value={destination.deepLink.androidScheme}
									placeholder="shopee://product/123"
								/>
							</div>
							<div class="space-y-2">
								<Label for="destination-android-package-{index}">Android package</Label>
								<Input
									id="destination-android-package-{index}"
									name="destinationAndroidPackageName"
									bind:value={destination.deepLink.androidPackageName}
									placeholder="com.example.app"
								/>
							</div>
							<div class="space-y-2 md:col-span-2">
								<Label for="destination-android-store-{index}">Play Store URL</Label>
								<Input
									id="destination-android-store-{index}"
									name="destinationAndroidStoreUrl"
									type="url"
									bind:value={destination.deepLink.androidStoreUrl}
									placeholder="Leave blank to derive from package"
								/>
							</div>
							<div class="space-y-2">
								<Label for="destination-ios-scheme-{index}">iOS app URL</Label>
								<Input
									id="destination-ios-scheme-{index}"
									name="destinationIosScheme"
									bind:value={destination.deepLink.iosScheme}
									placeholder="myapp://offer/123"
								/>
							</div>
							<div class="space-y-2">
								<Label for="destination-ios-id-{index}">Apple App ID</Label>
								<Input
									id="destination-ios-id-{index}"
									name="destinationIosAppId"
									inputmode="numeric"
									bind:value={destination.deepLink.iosAppId}
									placeholder="Numeric ID"
								/>
							</div>
							<div class="space-y-2 md:col-span-2">
								<Label for="destination-ios-store-{index}">App Store URL</Label>
								<Input
									id="destination-ios-store-{index}"
									name="destinationIosStoreUrl"
									type="url"
									bind:value={destination.deepLink.iosStoreUrl}
									placeholder="Leave blank to derive from App ID"
								/>
							</div>
							<div class="space-y-2 md:col-span-2">
								<Label for="destination-universal-link-{index}">Universal / App Link</Label>
								<Input
									id="destination-universal-link-{index}"
									name="destinationUniversalLink"
									type="url"
									bind:value={destination.deepLink.universalLink}
									placeholder="https://app.example.com/offer/123"
								/>
							</div>
							<div class="space-y-2 md:col-span-2">
								<Label for="destination-web-fallback-{index}">Web fallback</Label>
								<Input
									id="destination-web-fallback-{index}"
									name="destinationWebFallbackUrl"
									type="url"
									bind:value={destination.deepLink.webFallbackUrl}
									placeholder="Defaults to destination URL"
								/>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="border-b border-border pb-6">
		<h2 class="mb-4 text-base font-semibold">Traffic behavior</h2>
		<div class="grid gap-3 sm:grid-cols-2">
			{#each behaviorOptions as option, i (i)}
				<label
					class="flex items-center gap-3 rounded-md border border-border px-3 py-3 text-sm font-medium"
				>
					<input type="checkbox" name={option[0]} checked={option[2]} class="size-4" />
					{option[1]}
				</label>
			{/each}
		</div>
	</section>

	<div class="flex flex-wrap items-center justify-between gap-3 pb-6">
		<Button href={campaign ? `/app/links/${campaign.id}` : '/app/links'} variant="ghost">
			<ArrowLeftIcon data-icon="inline-start" /> Cancel
		</Button>
		<Button type="submit" disabled={submitting}>
			<SaveIcon data-icon="inline-start" />
			{submitting ? 'Saving...' : submitLabel}
		</Button>
	</div>
</form>
