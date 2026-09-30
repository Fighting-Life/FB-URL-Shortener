<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Spinner } from '@/components/ui/spinner';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { AlertCircleIcon } from '@lucide/svelte';
	import { Button } from '@/components/ui/button';
	import Icon from '@iconify/svelte';

	let { data } = $props();

	let errorMessage = $state<string | undefined>(undefined);

	// svelte-ignore state_referenced_locally
	const { form, enhance, errors, submitting } = superForm(data.form, {
		id: 'forgot-password-form',
		async onSubmit(input) {
			errorMessage = undefined;
		},
		async onUpdate(event) {
			if (event.result.type === 'failure') {
				errorMessage = event.result.data.message;
				return;
			}
			if (event.result.data.resetPasswordRequired && event.result.data.email) {
				await goto(`/reset-password?email=${encodeURIComponent(event.result.data.email)}`);
				return;
			}
			await invalidateAll();
		}
	});
</script>

<div>
	<h1 class="font-display text-2xl font-semibold text-ink dark:text-paper">Forgot password</h1>
	<p class="mt-1.5 text-sm text-muted-foreground">
		Enter your email address to reset your password.
	</p>
</div>

{#if errorMessage}
	<Alert.Root variant="destructive">
		<AlertCircleIcon />
		<Alert.Title>Password reset failed!</Alert.Title>
		<Alert.Description>{errorMessage}</Alert.Description>
	</Alert.Root>
{/if}
<form method="POST" class="mt-8 space-y-5" use:enhance>
	<Field.Group>
		<Field.Field>
			<Label for="email">Email address</Label>
			<div class="relative">
				<Icon icon="mdi:email" class="absolute top-1/2 left-3 -translate-y-1/2" />
				<Input
					bind:value={$form.email}
					name="email"
					class="ps-10"
					autocomplete="email"
					placeholder="Your email"
					disabled={$submitting}
				/>
			</div>
			{#if $errors.email}
				<Field.Error>{$errors.email}</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field>
			<Button type="submit" class="w-full" disabled={$submitting}>
				{#if $submitting}
					<Spinner />
				{/if}
				{$submitting ? 'Resetting…' : 'Reset password'}
			</Button>
		</Field.Field>
	</Field.Group>
</form>

<p class="mt-8 text-center text-sm text-muted-foreground">
	Remember your password? <a href="/signin" class="font-medium text-signal hover:underline">Login</a
	>
</p>
