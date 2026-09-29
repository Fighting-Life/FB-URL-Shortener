<script lang="ts">
	import { ImagePlusIcon, LoaderCircleIcon } from '@lucide/svelte';
	import { getActiveEditor } from 'slx/core/composerContext.js';
	import { INSERT_IMAGE_COMMAND } from 'slx/core/plugins/Image/ImagePlugin.svelte';

	let { campaignId }: { campaignId: string } = $props();
	const activeEditor = getActiveEditor();
	let input: HTMLInputElement;
	let uploading = $state(false);
	let error = $state('');

	async function upload(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		uploading = true;
		error = '';
		try {
			const body = new FormData();
			body.set('campaignId', campaignId);
			body.set('media', file);
			const response = await fetch('/api/user/safelink-media', { method: 'POST', body });
			const result = await response.json();
			if (!response.ok || !result.data?.url) throw new Error(result.message ?? 'Upload failed');
			$activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, {
				src: result.data.url,
				altText: file.name.replace(/\.[^.]+$/, ''),
				maxWidth: 960
			});
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Upload failed';
		} finally {
			uploading = false;
			input.value = '';
		}
	}
</script>

<input
	bind:this={input}
	type="file"
	accept="image/jpeg,image/png,image/webp,image/gif"
	class="sr-only"
	onchange={upload}
/>
<button
	type="button"
	class="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-50"
	disabled={uploading}
	title={error || 'Upload image'}
	aria-label={error || 'Upload image'}
	onclick={() => input.click()}
>
	{#if uploading}
		<LoaderCircleIcon class="size-4 animate-spin" />
	{:else}
		<ImagePlusIcon class="size-4" />
	{/if}
</button>
