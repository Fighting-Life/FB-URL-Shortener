<script lang="ts" module>
	type UploadedFile = {
		name: string;
		type: string;
		size: number;
		uploadedAt: number;
		url: Promise<string>;
	};
</script>

<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import type { UpdateProfileInput } from '@/utils/validators';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '@/components/ui/input';
	import { Badge } from '@/components/ui/badge';
	import { PhoneInput } from '$lib/components/ui/phone-input';
	import { Button, buttonVariants } from '@/components/ui/button';
	import { Spinner } from '@/components/ui/spinner';
	import * as FileDropZone from '$lib/components/ui/file-drop-zone';
	import { displaySize, MEGABYTE } from '$lib/components/ui/file-drop-zone';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Progress } from '$lib/components/ui/progress';
	import { AlertCircleIcon, Camera, XIcon } from '@lucide/svelte';
	import { toast } from '@/stores/toast';
	import { sleep } from '$lib/utils/promise';

	let {
		user,
		form: formData
	}: {
		user?: User | null;
		form: SuperValidated<UpdateProfileInput>;
	} = $props();

	let phoneInput = $state<string | undefined>('');
	let errorMessage = $state<string | undefined>(undefined);
	let openUpload = $state(false);

	let files = $state<UploadedFile[]>([]);
	let date = new SvelteDate();
	let uploadedFile = $state<File | null>(null);
	let isUploading = $state(false);

	// svelte-ignore state_referenced_locally
	const { form, enhance, errors, submitting } = superForm(formData, {
		id: 'update-profile-form',
		async onSubmit(input) {
			errorMessage = undefined;
			$form.email = user?.email || '';
			$form.username = user?.username || '';
		},
		async onUpdate(event) {
			if (event.result.type === 'failure') {
				errorMessage = event.result.data.message;
				return;
			}
			toast.success(event.result.data.message ?? 'Profile updated successfully');
			await invalidateAll();
		}
	});

	function handlePhoneChange(value: string | undefined) {
		if (value) {
			const cleanNumber = value.replace(/[\s-]/g, '');
			$form.phone = cleanNumber;
		} else {
			$form.phone = '';
		}
	}

	$effect(() => {
		if (formData.data.phone && !phoneInput) {
			phoneInput = formData.data.phone;
		}
		if (phoneInput && typeof phoneInput === 'string' && phoneInput.trim() !== '') {
			const cleanNumber = phoneInput.replace(/[\s-]/g, '');
			$form.phone = cleanNumber;
		} else {
			$form.phone = '';
		}
	});

	const onUpload: FileDropZone.FileDropZoneRootProps['onUpload'] = async (files) => {
		await Promise.allSettled(files.map((file) => uploadFile(file)));
	};
	const onFileRejected: FileDropZone.FileDropZoneRootProps['onFileRejected'] = async ({
		reason,
		file
	}) => {
		toast.error(`${file.name} failed to upload ${Object.values(reason).join(', ')}`);
	};

	const uploadFile = async (file: File) => {
		if (files.find((f) => f.name === file.name)) return;
		const urlPromise = new Promise<string>((resolve) => {
			sleep(1000).then(() => resolve(URL.createObjectURL(file)));
		});

		files.push({
			name: `${new Date().getTime()}_${user?.name?.toLowerCase() || 'link-cloacking'}`,
			type: file.type,
			size: file.size,
			uploadedAt: Date.now(),
			url: urlPromise
		});
		uploadedFile = file;
		// await uploadToServer();
		await urlPromise;
	};

	async function uploadToServer() {
		if (!uploadedFile) return;

		try {
			isUploading = true;

			const formData = new FormData();
			formData.append('avatar', uploadedFile);
			const response = await fetch('/api/user/upload', {
				method: 'POST',
				body: formData
			});
			if (!response.ok) {
				throw new Error('Failed to upload file');
			}
			const result = await response.json();
			toast.success(result.message);
			isUploading = false;
		} catch (error: any) {
			toast.error(error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isUploading = false;
			await invalidateAll();
			openUpload = false;
			files = [];
		}
	}

	async function deleteFile(url: string, index: number) {
		if (url.startsWith('blob:') || !url.startsWith('http')) {
			URL.revokeObjectURL(url);
			files = [...files.slice(0, index), ...files.slice(index + 1)];
			return;
		}
		try {
			const response = await fetch('/api/user/upload', {
				method: 'DELETE',
				body: JSON.stringify({
					url
				})
			});
			if (!response.ok) {
				throw new Error('Failed to delete file');
			}
			const result = await response.json();
			toast.success(result.message);
			URL.revokeObjectURL(url);
			files = [...files.slice(0, index), ...files.slice(index + 1)];
			await invalidateAll();
		} catch (error: any) {
			toast.error(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	onDestroy(async () => {
		for (const file of files) {
			URL.revokeObjectURL(await file.url);
		}
	});

	$effect(() => {
		const interval = setInterval(() => {
			date.setTime(Date.now());
		}, 10);
		return () => {
			clearInterval(interval);
		};
	});

	async function handleClose() {
		openUpload = false;
		for (const file of files) {
			URL.revokeObjectURL(await file.url);
		}
		files = [];
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Update Profile</Card.Title>
		<Card.Description>Update your profile information.</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		<div class="rounded-lg border border-border bg-background p-4">
			<div class="flex items-center gap-2">
				<div class="relative">
					<Avatar.Root class="size-16 rounded-full">
						<Avatar.Image src={user?.image} alt={user?.name} />
						<Avatar.Fallback>{user?.name.slice(0, 2).toUpperCase() ?? 'NA'}</Avatar.Fallback>
					</Avatar.Root>
					<Button
						variant="ghost"
						size="icon"
						class="absolute right-0 -bottom-2"
						onclick={() => (openUpload = true)}
					>
						<Camera />
					</Button>
				</div>
				<div class="grid flex-1 text-left text-sm leading-tight">
					<div class="flex items-center gap-2">
						<div class="truncate font-medium">
							{user?.name}
						</div>
						<Badge variant="default" class="mb-2 rounded-sm text-[9px] uppercase">
							{user?.role}
						</Badge>
					</div>
					<span class="truncate text-xs text-muted-foreground">{user?.email}</span>
				</div>
			</div>
		</div>
		<form method="POST" action="?/profile" use:enhance>
			<Field.Group>
				{#if errorMessage}
					<Alert.Root variant="destructive">
						<AlertCircleIcon />
						<Alert.Title>Error!</Alert.Title>
						<Alert.Description>{errorMessage}</Alert.Description>
					</Alert.Root>
				{/if}
				<Field.Field>
					<Field.Label for="name">Name</Field.Label>
					<Input
						bind:value={$form.name}
						name="name"
						placeholder="Your name"
						autocomplete="name"
						disabled={$submitting}
					/>
					{#if $errors.name}
						<Field.Error>{$errors.name}</Field.Error>
					{/if}
				</Field.Field>
				<Field.Field>
					<Field.Label for="username">Username</Field.Label>
					<Input
						bind:value={$form.username}
						name="username"
						placeholder="Your username"
						autocomplete="username"
						disabled={$submitting}
						readonly
					/>
					{#if $errors.username}
						<Field.Error>{$errors.username}</Field.Error>
					{/if}
				</Field.Field>
				<Field.Field>
					<Field.Label for="email">Email</Field.Label>
					<Input
						bind:value={$form.email}
						name="email"
						placeholder="Your email"
						autocomplete="email"
						disabled={$submitting}
						readonly
					/>
					{#if $errors.email}
						<Field.Error>{$errors.email}</Field.Error>
					{/if}
				</Field.Field>
				<Field.Field>
					<Field.Label for="phone">Phone</Field.Label>
					<PhoneInput
						bind:value={phoneInput}
						name="phone"
						placeholder="Your phone"
						disabled={$submitting}
					/>
					{#if $errors.phone}
						<Field.Error>{$errors.phone}</Field.Error>
					{/if}
				</Field.Field>
				<Field.Field>
					<Button type="submit" class="w-full" disabled={$submitting}>
						{#if $submitting}
							<Spinner />
						{/if}
						{$submitting ? 'Updating...' : 'Update Profile'}
					</Button>
				</Field.Field>
			</Field.Group>
		</form>
	</Card.Content>
</Card.Root>
<Dialog.Root bind:open={openUpload}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Upload Image</Dialog.Title>
			<Dialog.Description>Upload your profile image.</Dialog.Description>
		</Dialog.Header>
		<div class="flex w-full flex-col gap-2 p-6">
			{#if isUploading}
				<Empty.Root class="w-full">
					<Empty.Header>
						<Empty.Media variant="icon">
							<Spinner />
						</Empty.Media>
						<Empty.Title>Uploading...</Empty.Title>
						<Empty.Description>Please wait while we process your request.</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<FileDropZone.Root
					{onUpload}
					{onFileRejected}
					maxFileSize={5 * MEGABYTE}
					fileCount={files.length}
					accept="image/*"
					maxFiles={1}
					disabled={files.length > 0 || isUploading}
				>
					<FileDropZone.Trigger />
				</FileDropZone.Root>
				<div class="flex flex-col gap-2">
					{#each files as file, i (file.name)}
						<div class="flex place-items-center justify-between gap-2">
							<div class="flex place-items-center gap-2">
								{#await file.url then src}
									<div class="relative size-9 overflow-clip">
										<img
											{src}
											alt={file.name}
											class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-clip"
										/>
									</div>
								{/await}
								<div class="flex flex-col">
									<span>{file.name}</span>
									<span class="text-xs text-muted-foreground">{displaySize(file.size)}</span>
								</div>
							</div>
							{#await file.url}
								<Progress
									class="h-2 w-full grow"
									value={((date.getTime() - file.uploadedAt) / 1000) * 100}
									max={100}
								/>
							{:then url}
								<Button variant="outline" size="icon" onclick={() => deleteFile(url, i)}>
									<XIcon />
								</Button>
							{/await}
						</div>
					{/each}
				</div>
			{/if}
		</div>
		<Dialog.Footer>
			<Dialog.Close
				type="button"
				class={buttonVariants({ variant: 'outline' })}
				onclick={handleClose}
			>
				Cancel
			</Dialog.Close>
			<Button type="button" onclick={uploadToServer}>Upload Image</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
