<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as UnderlineTabs from '$lib/components/ui/underline-tabs/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { TagsInput } from '$lib/components/ui/tags-input/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { AppSidebarLayout } from '@/components/app';
	import { AppSettingUploadImage } from '@/components/app/setting/index.js';
	import Icon from '@iconify/svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';

	let { data } = $props();

	let setting = $derived(data.setting);

	// svelte-ignore state_referenced_locally
	let keywordsInput = $state<string[]>(setting?.site_keywords?.split(',') || []);
	let errorMessage = $state<string | null>(null);
	let successMessage = $state<string | null>(null);
	let tab = $state('general');

	// svelte-ignore state_referenced_locally
	const { form, enhance, errors, submitting } = superForm(data.form, {
		dataType: 'json',
		async onSubmit(input) {
			errorMessage = null;
			successMessage = null;
			$form.site_keywords = keywordsInput.join(', ');
		},
		async onUpdate(event) {
			if (event.result.type === 'failure') {
				errorMessage = event.result.data.message;
				return;
			}
			successMessage = event.result.data.message;
			await invalidateAll();
			setTimeout(() => {
				errorMessage = null;
				successMessage = null;
			}, 3000);
		}
	});
</script>

<AppSidebarLayout page="Settings" user={data.user} setting={data.setting}>
	<div class="space-y-6 px-4 py-4 sm:px-6">
		<div class="rounded-md border-t border-border bg-card p-2 shadow-md">
			<UnderlineTabs.Root bind:value={tab} onValueChange={(tab) => (tab = tab)}>
				<UnderlineTabs.List>
					<UnderlineTabs.Trigger value="general">General</UnderlineTabs.Trigger>
					<UnderlineTabs.Trigger value="brand">Logo & Favicon</UnderlineTabs.Trigger>
				</UnderlineTabs.List>
				<UnderlineTabs.Content value="general">
					<form method="POST" use:enhance>
						<Card.Root>
							<Card.Header>
								<Card.Title>Platform Settings</Card.Title>
								<Card.Description>Manage the platform settings.</Card.Description>
							</Card.Header>
							<Card.Content class="flex flex-col gap-4">
								<Field.Group>
									{#if errorMessage}
										<Alert.Root variant="destructive">
											<Icon icon="mingcute:warning-line" class="size-4" />
											<Alert.Title>Error!</Alert.Title>
											<Alert.Description>{errorMessage}</Alert.Description>
										</Alert.Root>
									{/if}
									{#if successMessage}
										<Alert.Root class="bg-success/30 dark:bg-success/40">
											<Icon icon="mingcute:check-line" class="size-4" />
											<Alert.Title>Success!</Alert.Title>
											<Alert.Description>{successMessage}</Alert.Description>
										</Alert.Root>
									{/if}
									<Field.Field>
										<Field.Label for="site_name">Site Name</Field.Label>
										<Input
											bind:value={$form.site_name}
											name="site_name"
											placeholder="Site Name"
											autocomplete="name"
											aria-invalid={!!$errors.site_name}
											disabled={$submitting}
										/>
										{#if $errors.site_name}
											<Field.Error>{$errors.site_name}</Field.Error>
										{/if}
									</Field.Field>
									<Field.Field>
										<Field.Label for="site_tagline">Site Tagline</Field.Label>
										<Input
											bind:value={$form.site_tagline}
											name="site_tagline"
											placeholder="Site Tagline"
											autocomplete="name"
											aria-invalid={!!$errors.site_tagline}
											disabled={$submitting}
										/>
										{#if $errors.site_tagline}
											<Field.Error>{$errors.site_tagline}</Field.Error>
										{/if}
									</Field.Field>
									<Field.Field>
										<Field.Label for="site_meta_title">Site Meta Title</Field.Label>
										<Input
											bind:value={$form.site_meta_title}
											name="site_meta_title"
											placeholder="Site Meta Title"
											autocomplete="name"
											aria-invalid={!!$errors.site_meta_title}
											disabled={$submitting}
										/>
										{#if $errors.site_meta_title}
											<Field.Error>{$errors.site_meta_title}</Field.Error>
										{/if}
									</Field.Field>
									<Field.Field>
										<Field.Label for="site_meta_description">Site Meta Description</Field.Label>
										<Textarea
											bind:value={$form.site_meta_description}
											name="site_meta_description"
											placeholder="Site Meta Description"
											rows={4}
											autocomplete="on"
											aria-invalid={!!$errors.site_meta_description}
											disabled={$submitting}
										/>
										{#if $errors.site_meta_description}
											<Field.Error>{$errors.site_meta_description}</Field.Error>
										{/if}
									</Field.Field>
									<Field.Field>
										<Field.Label for="site_url">Site URL</Field.Label>
										<Input
											bind:value={$form.site_url}
											type="url"
											name="site_url"
											placeholder="Site URL"
											autocomplete="url"
											aria-invalid={!!$errors.site_url}
											disabled={$submitting}
										/>
										{#if $errors.site_url}
											<Field.Error>{$errors.site_url}</Field.Error>
										{/if}
									</Field.Field>
									<Field.Field>
										<Field.Label for="site_og_title">Site OG Title</Field.Label>
										<Input
											bind:value={$form.site_og_title}
											name="site_og_title"
											placeholder="Site OG Title"
											autocomplete="name"
											aria-invalid={!!$errors.site_og_title}
											disabled={$submitting}
										/>
										{#if $errors.site_og_title}
											<Field.Error>{$errors.site_og_title}</Field.Error>
										{/if}
									</Field.Field>
									<Field.Field>
										<Field.Label for="site_og_description">Site OG Description</Field.Label>
										<Textarea
											bind:value={$form.site_og_description}
											name="site_og_description"
											placeholder="Site OG Description"
											rows={4}
											autocomplete="on"
											aria-invalid={!!$errors.site_og_description}
											disabled={$submitting}
										/>
										{#if $errors.site_og_description}
											<Field.Error>{$errors.site_og_description}</Field.Error>
										{/if}
									</Field.Field>
									<Field.Field>
										<Field.Label for="site_keywords">Site Keywords</Field.Label>
										<TagsInput
											bind:value={keywordsInput}
											name="site_keywords"
											placeholder="Site Keywords"
											autocomplete="name"
											aria-invalid={!!$errors.site_keywords}
											disabled={$submitting}
											onValueChange={(value) => {
												$form.site_keywords = value.join(',');
											}}
										/>
										{#if $errors.site_keywords}
											<Field.Error>{$errors.site_keywords}</Field.Error>
										{/if}
									</Field.Field>
									<Field.Field orientation="horizontal">
										<Field.Content>
											<Field.Label for="enable_register">Enable Register</Field.Label>
											<Field.Description>Enable or disable user registration.</Field.Description>
										</Field.Content>
										<Switch
											name="enable_register"
											bind:checked={$form.enable_register}
											disabled={$submitting}
										/>
										<input type="hidden" name="enable_register" value={$form.enable_register} />
									</Field.Field>
								</Field.Group>
							</Card.Content>
							<Card.Footer class="flex justify-end">
								<Button type="submit" disabled={$submitting}>
									{#if $submitting}
										<Spinner />
									{/if}
									{$submitting ? 'Updating...' : 'Update Settings'}
								</Button>
							</Card.Footer>
						</Card.Root>
					</form>
				</UnderlineTabs.Content>
				<UnderlineTabs.Content value="brand">
        <div class="grid gap-4">
					<Card.Root>
						<Card.Header>
							<Card.Title>Site Logo</Card.Title>
							<Card.Description>Upload your site logo.</Card.Description>
						</Card.Header>
						<Card.Content>
							<AppSettingUploadImage
								key="site_logo"
								settings={setting}
								onchange={(url) => {
									$form.site_logo = url;
								}}
							/>
						</Card.Content>
					</Card.Root>
          <Card.Root>
						<Card.Header>
							<Card.Title>Site Favicon</Card.Title>
							<Card.Description>Upload your site favicon.</Card.Description>
						</Card.Header>
						<Card.Content>
							<AppSettingUploadImage
								key="site_favicon"
								settings={setting}
								onchange={(url) => {
									$form.site_favicon = url;
								}}
							/>
						</Card.Content>
					</Card.Root>
          </div>
				</UnderlineTabs.Content>
			</UnderlineTabs.Root>
		</div>
	</div>
</AppSidebarLayout>
