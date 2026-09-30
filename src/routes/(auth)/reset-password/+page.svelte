<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Password from '$lib/components/ui/password';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '@/components/ui/button';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Spinner } from '@/components/ui/spinner';
	import { AlertCircleIcon } from '@lucide/svelte';
	import Icon from '@iconify/svelte';

	let { data } = $props();

	let errorMessage = $state<string | undefined>(undefined);

	const { form, enhance, errors, submitting } = superForm(
		untrack(() => data.form),
		{
			id: 'reset-password-form',
			async onSubmit() {
				errorMessage = undefined;
			},
			async onUpdate(event) {
				if (event.result.type === 'failure') {
					errorMessage = event.result.data.message;
					return;
				}
				if (event.result.data.success) {
					await goto('/signin');
				}
			}
		}
	);
</script>

<div>
	<h1 class="font-display text-2xl font-semibold text-ink dark:text-paper">Reset password</h1>
	<p class="mt-1.5 text-sm text-muted-foreground">
		Enter the code from your email and choose a new password.
	</p>
</div>

{#if errorMessage}
	<Alert.Root variant="destructive" class="mt-6">
		<AlertCircleIcon />
		<Alert.Title>Reset failed</Alert.Title>
		<Alert.Description>{errorMessage}</Alert.Description>
	</Alert.Root>
{/if}

<form method="POST" class="mt-8 space-y-5" use:enhance>
	<Field.Group>
		<Field.Field>
			<Label for="email">Email address</Label>
			<Input bind:value={$form.email} name="email" type="email" autocomplete="email" />
			{#if $errors.email}
				<Field.Error>{$errors.email}</Field.Error>
			{/if}
		</Field.Field>

		<Field.Field>
			<Label for="otp">Reset code</Label>
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
			{#if $errors.otp}
				<Field.Error>{$errors.otp}</Field.Error>
			{/if}
		</Field.Field>

		<Field.Field>
			<Label for="password">New password</Label>
			<div class="relative">
				<Icon icon="material-symbols:key" class="absolute top-1/2 left-3 -translate-y-1/2" />
				<Password.Root>
					<Password.Input
						bind:value={$form.password}
						name="password"
						class="ps-10"
						autocomplete="new-password"
						placeholder="Enter a new password"
					>
						<Password.ToggleVisibility />
					</Password.Input>
				</Password.Root>
			</div>
			{#if $errors.password}
				<Field.Error>{$errors.password}</Field.Error>
			{/if}
		</Field.Field>

		<Field.Field>
			<Label for="confirmPassword">Confirm password</Label>
			<div class="relative">
				<Icon icon="material-symbols:key" class="absolute top-1/2 left-3 -translate-y-1/2" />
				<Password.Root>
					<Password.Input
						bind:value={$form.confirmPassword}
						name="confirmPassword"
						class="ps-10"
						autocomplete="new-password"
						placeholder="Confirm your new password"
					>
						<Password.ToggleVisibility />
					</Password.Input>
				</Password.Root>
			</div>
			{#if $errors.confirmPassword}
				<Field.Error>{$errors.confirmPassword}</Field.Error>
			{/if}
		</Field.Field>

		<Field.Field>
			<Button type="submit" class="w-full" disabled={$submitting}>
				{#if $submitting}
					<Spinner />
				{/if}
				{$submitting ? 'Resetting...' : 'Reset password'}
			</Button>
		</Field.Field>
	</Field.Group>
</form>
