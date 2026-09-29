<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { EnableTwoFactorInput } from '@/utils/validators';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '@/components/ui/input';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Badge } from '@/components/ui/badge';
	import { Button } from '@/components/ui/button';
	import { Spinner } from '@/components/ui/spinner';
	import * as Password from '$lib/components/ui/password';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { confirmDelete, ConfirmDeleteDialog } from '$lib/components/ui/confirm-delete-dialog';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import {
		AlertCircleIcon,
		CheckCircle,
		CircleX,
		ShieldCheck,
		Smartphone,
		Mail,
		Key,
		Copy,
		Download,
		Info
	} from '@lucide/svelte';
	import { authClient } from '@/client/auth';
	import { toast } from '@/stores/toast';

	let {
		user,
		form: formData
	}: {
		user?: User | null;
		form: SuperValidated<EnableTwoFactorInput>;
	} = $props();

	let passwordConfirm = $state<string>('');
	let openConfirmEnable = $state<boolean>(false);
	let openTotpSetup = $state<boolean>(false);
	let errorMessage = $state<string | undefined>(undefined);
	let isLoading = $state<boolean>(false);

	let verificationCode = $state<string>('');
	let recoveryCodes = $state<string[]>([]);
	let showRecoveryCodes = $state<boolean>(false);
	let step = $state<'confirm' | 'setup' | 'verify' | 'complete'>('confirm');

	async function handleTwoFactorChange(val: boolean) {
		if (val === true) {
			openConfirmEnable = true;
			step = 'confirm';
			errorMessage = undefined;
			passwordConfirm = '';
		} else {
			await handleDisableTwoFactor();
		}
	}

	async function handleConfirmEnable() {
		if (!passwordConfirm || passwordConfirm.length < 8) {
			errorMessage = 'Please enter your password';
			return;
		}

		isLoading = true;
		errorMessage = undefined;

		try {
			const enableResult = await authClient.twoFactor.enable({
				password: passwordConfirm,
				method: 'otp'
			});

			if (enableResult.error) {
				errorMessage = enableResult.error.message || 'Failed to enable 2FA';
				toast.error(errorMessage);
				return;
			}

			openConfirmEnable = false;
			openTotpSetup = true;
			step = 'setup';
			verificationCode = '';
		} catch (error) {
			console.error('Error enabling 2FA:', error);
			errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
			toast.error(errorMessage);
		} finally {
			isLoading = false;
		}
	}

	async function handleVerifyTotp() {
		if (!verificationCode || verificationCode.length !== 6) {
			errorMessage = 'Please enter a valid 6-digit verification code';
			return;
		}

		isLoading = true;
		errorMessage = undefined;

		try {
			const verifyResult = await authClient.twoFactor.verifyTotp({
				code: verificationCode
				// Optional: pass the secret if needed
			});

			if (verifyResult.error) {
				errorMessage = verifyResult.error.message || 'Invalid verification code';
				toast.error(errorMessage);
				return;
			}

			// Get recovery codes
			const recoveryResult = await authClient.twoFactor.generateBackupCodes({
				password: passwordConfirm
			});

			if (recoveryResult.error) {
				console.warn('Failed to get recovery codes:', recoveryResult.error);
			}

			recoveryCodes = recoveryResult.data?.backupCodes || [];

			step = 'complete';
			showRecoveryCodes = true;
			toast.success('2FA enabled successfully!');

			await invalidateAll();
		} catch (error) {
			console.error('Error verifying TOTP:', error);
			errorMessage = error instanceof Error ? error.message : 'Verification failed';
			toast.error(errorMessage);
		} finally {
			isLoading = false;
		}
	}

	async function handleDisableTwoFactor() {
		if (!user?.twoFactorEnabled) return;

		confirmDelete({
			title: 'Disable 2FA',
			description: 'Are you sure you want to disable 2FA? This will reduce your account security.',
			onConfirm: async () => {
				isLoading = true;

				try {
					const result = await authClient.twoFactor.disable({
						password: prompt('Enter your password to confirm:') || ''
					});

					if (result.error) {
						toast.error(result.error.message || 'Failed to disable 2FA');
						return;
					}

					toast.success('2FA disabled successfully');
					await invalidateAll();
				} catch (error) {
					console.error('Error disabling 2FA:', error);
					toast.error('Failed to disable 2FA');
				} finally {
					isLoading = false;
				}
			}
		});
	}

	function copyRecoveryCodes() {
		if (recoveryCodes.length === 0) return;

		const text = recoveryCodes.join('\n');
		navigator.clipboard
			.writeText(text)
			.then(() => toast.success('Recovery codes copied to clipboard'))
			.catch(() => toast.error('Failed to copy codes'));
	}

	function downloadRecoveryCodes() {
		if (recoveryCodes.length === 0) return;

		const text = [
			'=== 2FA RECOVERY CODES ===',
			'',
			'Keep these codes in a safe place.',
			'Each code can only be used once.',
			'',
			...recoveryCodes,
			'',
			`Generated: ${new Date().toLocaleString()}`
		].join('\n');

		const blob = new Blob([text], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `2fa-recovery-codes-${new Date().toISOString().split('T')[0]}.txt`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast.success('Recovery codes downloaded');
	}
</script>

<ConfirmDeleteDialog />

<Card.Root>
	<Card.Content class="space-y-4">
		<Field.Field orientation="horizontal">
			<Field.Content>
				<Field.Label for="two_factor_enabled" class="flex items-center gap-2">
					<ShieldCheck class="size-4" />
					Multi-factor authentication
				</Field.Label>
				<Field.Description>
					Enable multi-factor authentication for enhanced security. You'll need to use an
					authenticator app like Google Authenticator, Microsoft Authenticator, or Authy.
				</Field.Description>
				{#if user?.twoFactorEnabled}
					<Badge variant="default" class="mt-1">
						<CheckCircle class="mr-1 size-3" />
						Enabled
					</Badge>
				{/if}
			</Field.Content>
			<div class="flex items-center gap-2">
				{#if isLoading}
					<Spinner class="size-4" />
				{/if}
				<Switch
					id="two_factor_enabled"
					name="two_factor_enabled"
					checked={user?.twoFactorEnabled ?? false}
					disabled={isLoading}
					onCheckedChange={handleTwoFactorChange}
				/>
			</div>
		</Field.Field>
	</Card.Content>
</Card.Root>

<!-- Step 1: Confirm Password Dialog -->
<AlertDialog.Root bind:open={openConfirmEnable}>
	<AlertDialog.Content class="max-w-md">
		<AlertDialog.Header>
			<AlertDialog.Title>Enable 2FA</AlertDialog.Title>
			<AlertDialog.Description>
				To enable 2FA, please confirm your password. You'll then set up your authenticator app.
			</AlertDialog.Description>
		</AlertDialog.Header>

		<form onsubmit={handleConfirmEnable}>
			<div class="space-y-4">
				<Field.Field>
					<Field.Label for="password_confirm">Password</Field.Label>
					<Password.Root>
						<Password.Input
							bind:value={passwordConfirm}
							id="password_confirm"
							name="password_confirm"
							required
							placeholder="Enter your password"
							disabled={isLoading}
						>
							<Password.ToggleVisibility />
						</Password.Input>
						<Password.Strength />
					</Password.Root>
					<Field.Description class="text-xs">
						<Key class="inline size-3" />
						Your password is required to enable 2FA
					</Field.Description>
				</Field.Field>

				{#if errorMessage}
					<Alert.Root variant="destructive">
						<CircleX class="size-4" />
						<Alert.Title>Error</Alert.Title>
						<Alert.Description>{errorMessage}</Alert.Description>
					</Alert.Root>
				{/if}

				<Field.Field orientation="horizontal" class="flex items-center justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onclick={() => {
							passwordConfirm = '';
							errorMessage = undefined;
							openConfirmEnable = false;
						}}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isLoading}>
						{#if isLoading}
							<Spinner class="mr-2 size-4" />
							Verifying...
						{:else}
							Continue
						{/if}
					</Button>
				</Field.Field>
			</div>
		</form>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Step 2: TOTP Setup Dialog -->
<Dialog.Root bind:open={openTotpSetup}>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Set Up Authenticator</Dialog.Title>
			<Dialog.Description>Enter the 6-digit OTP code we sent to your email.</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			{#if step === 'setup'}
				<div class="flex flex-col items-center space-y-4">
					<!-- Instructions -->
					<Alert.Root class="bg-primary/20 text-primary">
						<Info class="size-4" />
						<Alert.Title>How to set up</Alert.Title>
						<Alert.Description class="space-y-1 text-sm">
							<ol class="list-decimal space-y-1 pl-4">
								<li>Open your email inbox</li>
								<li>Find the email we sent to you</li>
								<li>Enter the 6-digit OTP code below</li>
							</ol>
						</Alert.Description>
					</Alert.Root>

					<!-- Verification Code Input -->
					<div class="w-full">
						<Field.Field>
							<Field.Label for="verification_code">Verification Code</Field.Label>
							<InputOTP.Root
								bind:value={verificationCode}
								id="verification_code"
								name="verification_code"
								maxlength={6}
								pattern={REGEXP_ONLY_DIGITS}
								class="justify-center"
								onValueChange={(val) => {
									if (val.length === 6) {
										handleVerifyTotp();
									}
								}}
							>
								{#snippet children({ cells })}
									<InputOTP.Group>
										{#each cells as cell, i (i)}
											<InputOTP.Slot {cell} />
										{/each}
									</InputOTP.Group>
								{/snippet}
							</InputOTP.Root>
							<Field.Description class="text-xs">
								<Smartphone class="inline size-3" />
								Enter the 6-digit code from your authenticator app
							</Field.Description>
						</Field.Field>
					</div>

					{#if errorMessage}
						<Alert.Root variant="destructive" class="w-full">
							<CircleX class="size-4" />
							<Alert.Title>Error</Alert.Title>
							<Alert.Description>{errorMessage}</Alert.Description>
						</Alert.Root>
					{/if}

					<!-- Actions -->
					<div class="flex w-full items-center justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onclick={() => {
								openTotpSetup = false;
								step = 'confirm';
								verificationCode = '';
								errorMessage = undefined;
							}}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onclick={handleVerifyTotp}
							disabled={isLoading || verificationCode.length !== 6}
						>
							{#if isLoading}
								<Spinner class="mr-2 size-4" />
								Verifying...
							{:else}
								Verify & Enable
							{/if}
						</Button>
					</div>
				</div>
			{/if}

			<!-- Step 3: Recovery Codes -->
			{#if step === 'complete' && showRecoveryCodes}
				<div class="space-y-4">
					<div class="flex items-center gap-2">
						<ShieldCheck class="size-5 text-green-600" />
						<h3 class="text-lg font-semibold text-green-600">2FA Enabled Successfully!</h3>
					</div>

					<Alert.Root class="bg-orange/20 dark:bg-orange/50 text-orange">
						<AlertCircleIcon class="size-4" />
						<Alert.Title>Save Your Recovery Codes</Alert.Title>
						<Alert.Description>
							These recovery codes can be used to access your account if you lose access to your
							authenticator app. <strong>Store them securely</strong> and do not share them.
						</Alert.Description>
					</Alert.Root>

					<div class="rounded-lg border bg-muted/50 p-4">
						<div class="grid grid-cols-2 gap-2 font-mono text-sm">
							{#each recoveryCodes as code, i (i)}
								<div class="flex items-center gap-2 rounded bg-background px-3 py-2">
									<span class="text-xs text-muted-foreground"
										>{String(i + 1).padStart(2, '0')}.</span
									>
									<code class="tracking-wider">{code}</code>
								</div>
							{/each}
						</div>
					</div>

					<div class="flex flex-wrap gap-2">
						<Button type="button" variant="outline" size="sm" onclick={copyRecoveryCodes}>
							<Copy class="mr-2 size-4" />
							Copy Codes
						</Button>
						<Button type="button" variant="outline" size="sm" onclick={downloadRecoveryCodes}>
							<Download class="mr-2 size-4" />
							Download
						</Button>
						<Button
							type="button"
							size="sm"
							class="ml-auto"
							onclick={() => {
								openTotpSetup = false;
								step = 'confirm';
								showRecoveryCodes = false;
							}}
						>
							Done
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>

<style scoped>
	:global(ol.list-decimal) {
		list-style: decimal;
	}
</style>
