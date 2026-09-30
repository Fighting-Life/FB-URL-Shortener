<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Password from '$lib/components/ui/password';
	import { Spinner } from '@/components/ui/spinner';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { AlertCircleIcon } from '@lucide/svelte';
	import { Button } from '@/components/ui/button';
	import { authClient } from '@/client/auth.js';
	import Icon from '@iconify/svelte';
	import type { ZxcvbnResult } from '@zxcvbn-ts/core';

	let { data } = $props();

	let errorMessage = $state<string | undefined>(undefined);
	const SCORE_NAMING = ['Poor', 'Weak', 'Average', 'Strong', 'Secure'];
	let strength = $state<ZxcvbnResult>();

	// svelte-ignore state_referenced_locally
	const { form, enhance, errors, submitting } = superForm(data.form, {
		id: 'signup-form',
		async onSubmit(input) {
			errorMessage = undefined;
		},
		async onUpdate(event) {
			if (event.result.type === 'failure') {
				errorMessage = event.result.data.message;
				return;
			}
			if (event.result.data.verifyEmailRequired && event.result.data.email) {
				await goto(`/otp-verification?email=${encodeURIComponent(event.result.data.email)}`);
				return;
			}
			await invalidateAll();
		}
	});

	async function handleSocialSignIn(provider: string) {
		const result = await authClient.signIn.social({
			provider
		});
		if (result?.error) {
			errorMessage = result.error.message || 'Social sign-in failed';
			return;
		}
		if (!result?.data.url) {
			errorMessage = 'Social sign-in failed';
			return;
		}
		await goto(result.data.url);
		return;
	}
</script>

<div>
	<h1 class="font-display text-2xl font-semibold text-ink dark:text-paper">Sign up</h1>
	<p class="mt-1.5 text-sm text-muted-foreground">Sign up for free. No credit card required.</p>
</div>

{#if errorMessage}
	<Alert.Root variant="destructive">
		<AlertCircleIcon />
		<Alert.Title>Sign up failed!</Alert.Title>
		<Alert.Description>{errorMessage}</Alert.Description>
	</Alert.Root>
{/if}
<form method="POST" class="mt-8 space-y-5" use:enhance>
	<Field.Group>
		<Field.Field>
			<Label for="name">Name</Label>
			<div class="relative">
				<Icon icon="mdi:account" class="absolute top-1/2 left-3 -translate-y-1/2" />
				<Input
					bind:value={$form.name}
					name="name"
					class="ps-10"
					autocomplete="name"
					placeholder="Your name"
					disabled={$submitting}
				/>
			</div>
			{#if $errors.name}
				<Field.Error>{$errors.name}</Field.Error>
			{/if}
		</Field.Field>
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
			<Label for="password">Password</Label>
			<div class="relative">
				<Icon icon="material-symbols:key" class="absolute top-2.5 left-3" />
				<Password.Root>
					<Password.Input
						bind:value={$form.password}
						name="password"
						class="ps-10"
						placeholder="Enter your password"
						autocomplete="current-password"
					>
						<Password.ToggleVisibility />
					</Password.Input>
					<div class="flex flex-col gap-1">
						<Password.Strength bind:strength />
						<span class="text-sm text-muted-foreground">
							{SCORE_NAMING[strength?.score ?? 0]}
						</span>
					</div>
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
						placeholder="Enter your password"
						autocomplete="current-password"
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
				{$submitting ? 'Signing up…' : 'Sign up'}
			</Button>
		</Field.Field>
		<Field.Separator class="text-xs">Or continue with</Field.Separator>
		<Field.Field>
			<Button
				type="button"
				variant="outline"
				class="w-full"
				onclick={() => handleSocialSignIn('google')}
			>
				<Icon icon="material-icon-theme:google" />
				Sign up with Google
			</Button>
		</Field.Field>
	</Field.Group>
</form>

<p class="mt-8 text-center text-sm text-muted-foreground">
	Already have an account? <a href="/signin" class="font-medium text-signal hover:underline"
		>Sign in</a
	>
</p>
