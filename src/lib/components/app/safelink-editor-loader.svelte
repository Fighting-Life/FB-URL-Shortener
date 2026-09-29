<script lang="ts">
	import { onMount, type Component } from 'svelte';

	type EditorProps = {
		campaignId: string;
		initialDocument: Record<string, unknown>;
		document: string;
	};

	let { campaignId, initialDocument, document = $bindable() }: EditorProps = $props();

	let Editor = $state<Component<EditorProps> | null>(null);
	let loadError = $state('');

	onMount(() => {
		let cancelled = false;

		void (async () => {
			try {
				const { default: Prism } = await import('prismjs');
				(globalThis as typeof globalThis & { Prism: typeof Prism }).Prism = Prism;
				const editorModule = await import('./safelink-editor.svelte');

				if (cancelled) return;
				Editor = editorModule.default;
			} catch (error) {
				if (!cancelled) {
					loadError = error instanceof Error ? error.message : 'Unable to load the editor.';
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	});
</script>

{#if Editor}
	<Editor {campaignId} {initialDocument} bind:document />
{:else if loadError}
	<div
		class="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-5 text-sm text-destructive"
	>
		The SafeLink editor could not be loaded. {loadError}
	</div>
{:else}
	<div
		class="flex min-h-80 items-center justify-center rounded-md border border-border bg-muted/30 text-sm text-muted-foreground"
	>
		Loading editor...
	</div>
{/if}
