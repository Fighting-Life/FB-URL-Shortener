<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Password from '$lib/components/ui/password';
	import { Spinner } from '@/components/ui/spinner';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { AlertCircleIcon } from '@lucide/svelte';
	import { Button } from '@/components/ui/button';
	import { authClient } from '@/client/auth.js';
	import Icon from '@iconify/svelte';

	let { data } = $props();

	let errorMessage = $state<string | undefined>(undefined);

	// svelte-ignore state_referenced_locally
	const { form, enhance, errors, submitting } = superForm(data.form, {
		id: 'signin-form',
		async onSubmit(input) {
			errorMessage = undefined;
		},
		async onUpdate(event) {
			if (event.result.type === 'failure') {
				errorMessage = event.result.data.message;
				return;
			}
			if (event.result.data.twoFactorRequired) {
				await goto('/2fa');
				return;
			}
			if (event.result.data.emailVerificationRequired && event.result.data.email) {
				await goto(`/otp-verification?email=${encodeURIComponent(event.result.data.email)}`);
				return;
			}
			await invalidateAll();
			await goto('/app');
		}
	});

	let isEmailFormat = $derived(
		$form.identifier.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($form.identifier)
	);

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
	<h1 class="font-display text-2xl font-semibold text-ink dark:text-paper">Welcome back</h1>
	<p class="mt-1.5 text-sm text-muted-foreground">
		Sign in to manage your links and routing rules.
	</p>
</div>

{#if errorMessage}
	<Alert.Root variant="destructive">
		<AlertCircleIcon />
		<Alert.Title>Login failed!</Alert.Title>
		<Alert.Description>{errorMessage}</Alert.Description>
	</Alert.Root>
{/if}

<form method="POST" class="mt-8 space-y-5" use:enhance>
	<Field.Group>
		<Field.Field>
			<Label for="identifier">{isEmailFormat ? 'Email address' : 'Username'}</Label>
			<div class="relative">
				{#if isEmailFormat}
					<Icon icon="mdi:email" class="absolute top-1/2 left-3 -translate-y-1/2" />
				{:else}
					<Icon icon="mdi:account" class="absolute top-1/2 left-3 -translate-y-1/2" />
				{/if}
				<Input
					bind:value={$form.identifier}
					name="identifier"
					class="ps-10"
					autocomplete={isEmailFormat ? 'username' : 'email'}
					placeholder={isEmailFormat ? 'Your username' : 'Your email'}
					disabled={$submitting}
				/>
			</div>
			{#if $errors.identifier}
				<Field.Error>{$errors.identifier}</Field.Error>
			{/if}
		</Field.Field>
		<Field.Field>
			<div class="flex items-center">
				<Field.Label for="password">Password</Field.Label>
				<a href="forgot-password" class="ms-auto text-xs underline-offset-4 hover:underline">
					Forgot your password?
				</a>
			</div>
			<div class="relative">
				<Icon icon="material-symbols:key" class="absolute top-1/2 left-3 -translate-y-1/2" />
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
				</Password.Root>
			</div>
			{#if $errors.password}
				<Field.Error>{$errors.password}</Field.Error>
			{/if}
		</Field.Field>
    <Field.Field>
      <div class="flex items-center gap-3">
    <Checkbox bind:checked={$form.remember} id="remember" name="remember" />
    <Label for="remember">Remember me</Label>
  </div>
  <input type="hidden" name="remember" value={$form.remember} />
    </Field.Field>
		<Field.Field>
			<Button type="submit" class="w-full" disabled={$submitting}>
				{#if $submitting}
					<Spinner />
				{/if}
				{$submitting ? 'Signing in…' : 'Sign in'}
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
				Sign in with Google
			</Button>
		</Field.Field>
	</Field.Group>
</form>
<p class="mt-8 text-center text-sm text-muted-foreground">
	Don't have an account? <a href="/signup" class="font-medium text-signal hover:underline"
		>Create one free</a
	>
</p>
