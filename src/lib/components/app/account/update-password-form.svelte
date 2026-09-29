<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { ChangePasswordInput } from '@/utils/validators';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Password from '$lib/components/ui/password/index.js';
	import { Button } from '@/components/ui/button';
	import { Spinner } from '@/components/ui/spinner';
	import { authClient } from '@/client/auth.js';
	import { AlertCircleIcon } from '@lucide/svelte';
	import { toast } from '@/stores/toast';

	let {
		user,
		form: formData
	}: {
		user?: User | null;
		form: SuperValidated<ChangePasswordInput>;
	} = $props();

	let errorMessage = $state<string | undefined>(undefined);
	// svelte-ignore state_referenced_locally
	const { form, enhance, errors, submitting } = superForm(formData, {
		id: 'update-password-form',
		async onSubmit(input) {
			errorMessage = undefined;
		},
		async onUpdate(event) {
			if (event.result.type === 'failure') {
				errorMessage = event.result.data.message;
				return;
			}
			toast.success(event.result.data.message ?? 'Password updated successfully');
			setTimeout(async () => {
				await logout();
			}, 1000);
		}
	});

	async function logout() {
		await authClient.signOut();
		const redirectTarget = `${window.location.pathname}${window.location.search}`;
		const signInHref = `/signin?redirect=${encodeURIComponent(redirectTarget)}`;
		window.location.assign(signInHref);
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Update Password</Card.Title>
		<Card.Description>Update your password information.</Card.Description>
	</Card.Header>
	<Card.Content>
		<form method="POST" action="?/password" use:enhance>
			<Field.Group>
				{#if errorMessage}
					<Alert.Root variant="destructive">
						<AlertCircleIcon />
						<Alert.Title>Error!</Alert.Title>
						<Alert.Description>{errorMessage}</Alert.Description>
					</Alert.Root>
				{/if}
				<Field.Field>
					<Field.Label for="currentPassword">Current Password</Field.Label>
					<Password.Root>
						<Password.Input
							name="currentPassword"
							placeholder="Current password"
							required
							autocomplete="current-password"
							disabled={$submitting}
							oninput={(e) => ($form.currentPassword = (e.target as HTMLInputElement)?.value || '')}
						>
							<Password.ToggleVisibility />
						</Password.Input>
					</Password.Root>
					{#if $errors.currentPassword}
						<Field.Error>{$errors.currentPassword}</Field.Error>
					{/if}
				</Field.Field>
				<Field.Field>
					<Field.Label for="newPassword">New Password</Field.Label>
					<Password.Root>
						<Password.Input
							name="newPassword"
							placeholder="New password"
							required
							autocomplete="new-password"
							disabled={$submitting}
							oninput={(e) => ($form.newPassword = (e.target as HTMLInputElement)?.value || '')}
						>
							<Password.ToggleVisibility />
						</Password.Input>
						<Password.Strength />
					</Password.Root>
					{#if $errors.newPassword}
						<Field.Error>{$errors.newPassword}</Field.Error>
					{/if}
				</Field.Field>
				<Field.Field>
					<Field.Label for="confirmPassword">Confirm Password</Field.Label>
					<Password.Root>
						<Password.Input
							name="confirmPassword"
							placeholder="Confirm password"
							required
							autocomplete="new-password"
							disabled={$submitting}
							oninput={(e) => ($form.confirmPassword = (e.target as HTMLInputElement)?.value || '')}
						>
							<Password.ToggleVisibility />
						</Password.Input>
					</Password.Root>
					{#if $errors.confirmPassword}
						<Field.Error>{$errors.confirmPassword}</Field.Error>
					{/if}
				</Field.Field>
				<Field.Field>
					<Button type="submit" class="w-full" disabled={$submitting}>
						{#if $submitting}
							<Spinner />
						{/if}
						{$submitting ? 'Updating...' : 'Update Password'}
					</Button>
				</Field.Field>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
