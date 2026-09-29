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
	import { SvelteDate } from 'svelte/reactivity';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as FileDropZone from '$lib/components/ui/file-drop-zone';
	import { displaySize, MEGABYTE } from '$lib/components/ui/file-drop-zone';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Progress } from '$lib/components/ui/progress';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { XIcon } from '@lucide/svelte';
	import { toast } from '$lib/stores/toast';
	import { sleep } from '$lib/utils/promise';

	let {
		key = $bindable(),
		settings,
		onchange
	}: {
		key: string;
		settings?: SiteSetting | null;
		onchange?: (image: string) => void;
	} = $props();

	let open = $state(false);
	let files = $state<UploadedFile[]>([]);
	let date = new SvelteDate();
	let uploadedFile = $state<File | null>(null);
	let isUploading = $state(false);

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
			name: `${new Date().getTime()}_${settings?.site_name?.toLowerCase() || 'link-shift'}`,
			type: file.type,
			size: file.size,
			uploadedAt: Date.now(),
			url: urlPromise
		});
		uploadedFile = file;
		await uploadToServer();
		await urlPromise;
	};

	async function uploadToServer() {
		if (!uploadedFile) return;

		try {
			isUploading = true;

			const formData = new FormData();
			formData.append('file', uploadedFile);
			formData.append('key', key);
			const response = await fetch('/api/setting/upload', {
				method: 'POST',
				body: formData
			});
			if (!response.ok) {
				throw new Error('Failed to upload file');
			}
			const result = await response.json();
			onchange?.(result.data);
			toast.success(result.message);
			isUploading = false;
		} catch (error: any) {
			toast.error(error instanceof Error ? error.message : 'Unknown error');
		} finally {
			isUploading = false;
			await invalidateAll();
			open = false;
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
			const response = await fetch('/api/setting/upload', {
				method: 'DELETE',
				body: JSON.stringify({
					key,
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
</script>

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
