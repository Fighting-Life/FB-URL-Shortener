<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '@/components/ui/button';
	import { Spinner } from '@/components/ui/spinner';
	import { AlertCircleIcon } from '@lucide/svelte';

	let { data } = $props();

	let errorMessage = $state<string | undefined>(undefined);
	let successMessage = $state<string | undefined>(undefined);

	const { form, enhance, errors, submitting } = superForm(
		untrack(() => data.form),
		{
			id: 'two-factor-form',
			async onSubmit() {
				errorMessage = undefined;
				successMessage = undefined;
			},
			async onUpdate(event) {
				if (event.result.type === 'failure') {
					errorMessage = event.result.data.message;
					return;
				}
				successMessage = event.result.data.message;
				if (event.result.data.success && !event.result.data.codeSent) {
					await invalidateAll();
					await goto('/app');
				}
			}
		}
	);
</script>

<div>
	<h1 class="font-display text-2xl font-semibold text-ink dark:text-paper">Two-factor check</h1>
	<p class="mt-1.5 text-sm text-muted-foreground">
		Request a code, then enter it to finish signing in.
	</p>
</div>

{#if errorMessage}
	<Alert.Root variant="destructive" class="mt-6">
		<AlertCircleIcon />
		<Alert.Title>Verification failed</Alert.Title>
		<Alert.Description>{errorMessage}</Alert.Description>
	</Alert.Root>
{/if}

{#if successMessage}
	<Alert.Root class="mt-6">
		<Alert.Title>{successMessage}</Alert.Title>
	</Alert.Root>
{/if}

<form method="POST" action="?/send" class="mt-8" use:enhance>
	<label class="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
		<input bind:checked={$form.trustDevice} name="trustDevice" type="checkbox" />
		Trust this device for 30 days
	</label>
	<Button type="submit" variant="outline" class="w-full">Send 2FA code</Button>
</form>

<form method="POST" action="?/verify" class="mt-5 space-y-5" use:enhance>
	<Field.Group>
		<Field.Field>
			<Field.Label for="otp">Authentication code</Field.Label>
			<InputOTP.Root
				bind:value={$form.otp}
				name="otp"
				maxlength={6}
				pattern={REGEXP_ONLY_DIGITS}
				class="justify-center"
			>
				{#snippet children({ cells })}
					<InputOTP.Group>
						{#each cells as cell, i (i)}
							<InputOTP.Slot {cell} />
						{/each}
					</InputOTP.Group>
				{/snippet}
			</InputOTP.Root>
			<input type="hidden" name="trustDevice" value={$form.trustDevice ? 'on' : ''} />
			{#if $errors.otp}
				<Field.Error>{$errors.otp}</Field.Error>
			{/if}
		</Field.Field>

		<Field.Field>
			<Button type="submit" class="w-full" disabled={$submitting}>
				{#if $submitting}
					<Spinner />
				{/if}
				{$submitting ? 'Verifying...' : 'Verify and sign in'}
			</Button>
		</Field.Field>
	</Field.Group>
</form>
