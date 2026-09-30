<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Spinner } from '@/components/ui/spinner';
	import { AlertCircleIcon } from '@lucide/svelte';

	let { data } = $props();

	let errorMessage = $state<string | undefined>(undefined);
	let successMessage = $state<string | undefined>(undefined);

	const { form, enhance, errors, submitting } = superForm(
		untrack(() => data.form),
		{
			id: 'otp-verification-form',
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
				if (event.result.data.success) {
					await goto('/signin');
				}
			}
		}
	);
</script>

<div>
	<h1 class="font-display text-2xl font-semibold text-ink dark:text-paper">Verify email</h1>
	<p class="mt-1.5 text-sm text-muted-foreground">Enter the 6-digit code we sent to your email.</p>
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

<form method="POST" action="?/verify" class="mt-8 space-y-5" use:enhance>
	<Field.Group>
		<Field.Field>
			<Label for="email">Email address</Label>
			<Input bind:value={$form.email} name="email" type="email" autocomplete="email" />
			{#if $errors.email}
				<Field.Error>{$errors.email}</Field.Error>
			{/if}
		</Field.Field>

		<Field.Field>
			<Label for="otp">Verification code</Label>
			<InputOTP.Root
				bind:value={$form.otp}
				name="otp"
				maxlength={6}
				pattern={REGEXP_ONLY_DIGITS}
				class="justify-center"
			>
				{#snippet children({ cells })}
					<InputOTP.Group>
						{#each cells as cell, i(i)}
							<InputOTP.Slot {cell} />
						{/each}
					</InputOTP.Group>
				{/snippet}
			</InputOTP.Root>
			{#if $errors.otp}
				<Field.Error>{$errors.otp}</Field.Error>
			{/if}
		</Field.Field>

		<Field.Field>
			<Button type="submit" class="w-full" disabled={$submitting}>
				{#if $submitting}
					<Spinner />
				{/if}
				{$submitting ? 'Verifying...' : 'Verify email'}
			</Button>
		</Field.Field>
	</Field.Group>
</form>

<form method="POST" action="?/resend" class="mt-3" use:enhance>
	<input type="hidden" name="email" value={$form.email} />
	<Button type="submit" variant="ghost" class="w-full">Resend code</Button>
</form>
