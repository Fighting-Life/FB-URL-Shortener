<script lang="ts">
	import { HeadingNode, QuoteNode } from '@lexical/rich-text';
	import { ListItemNode, ListNode } from '@lexical/list';
	import { AutoLinkNode, LinkNode } from '@lexical/link';
	import type { EditorState } from 'lexical';
	import Composer from 'slx/core/Composer.svelte';
	import ContentEditable from 'slx/core/ContentEditable.svelte';
	import HistoryPlugin from 'slx/core/plugins/HistoryPlugin.svelte';
	import ListPlugin from 'slx/core/plugins/ListPlugin.svelte';
	import OnChangePlugin from 'slx/core/plugins/OnChangePlugin.svelte';
	import PlaceHolder from 'slx/core/plugins/PlaceHolder.svelte';
	import RichTextPlugin from 'slx/core/plugins/RichTextPlugin.svelte';
	import LinkPlugin from 'slx/core/plugins/link/LinkPlugin.svelte';
	import ImagePlugin from 'slx/core/plugins/Image/ImagePlugin.svelte';
	import { ImageNode } from 'slx/core/plugins/Image/ImageNode.js';
	import SafelinkMediaButton from './safelink-media-button.svelte';
	import SafelinkToolbar from './safelink-toolbar.svelte';

	let {
		campaignId,
		initialDocument,
		document = $bindable()
	}: {
		campaignId: string;
		initialDocument: Record<string, unknown>;
		document: string;
	} = $props();

	const editorTheme = {
		link: 'safelink-editor-link',
		paragraph: 'safelink-editor-paragraph',
		quote: 'safelink-editor-quote',
		heading: { h1: 'safelink-editor-h1', h2: 'safelink-editor-h2', h3: 'safelink-editor-h3' },
		list: {
			ul: 'safelink-editor-ul',
			olDepth: ['safelink-editor-ol'],
			listitem: 'safelink-editor-listitem'
		},
		text: {
			bold: 'safelink-editor-bold',
			italic: 'safelink-editor-italic',
			underline: 'safelink-editor-underline',
			strikethrough: 'safelink-editor-strikethrough'
		},
		image: 'safelink-editor-image'
	};

	const initialConfig = $derived({
		namespace: `safelink-${campaignId}`,
		theme: editorTheme,
		nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, ImageNode],
		editorState: JSON.stringify(initialDocument),
		onError: (error: Error) => console.error('Safelink editor error', error)
	});

	function onChange(editorState: EditorState) {
		document = JSON.stringify(editorState.toJSON());
	}
</script>

<div class="overflow-hidden rounded-md border border-border bg-background">
	<Composer {initialConfig}>
		<SafelinkToolbar><SafelinkMediaButton {campaignId} /></SafelinkToolbar>
		<div class="relative min-h-80 bg-white text-zinc-900">
			<ContentEditable className="safelink-content-editable" ariaLabel="Safelink content" />
			<PlaceHolder className="safelink-placeholder"
				>Write the content visitors should see...</PlaceHolder
			>
		</div>
		<RichTextPlugin />
		<HistoryPlugin />
		<ListPlugin />
		<LinkPlugin attributes={{ rel: 'nofollow noreferrer noopener', target: '_blank' }} />
		<ImagePlugin />
		<OnChangePlugin ignoreHistoryMergeTagChange={false} ignoreSelectionChange={true} {onChange} />
	</Composer>
</div>

<style>
	:global(.safelink-content-editable) {
		min-height: 20rem;
		padding: 1.25rem 1.5rem;
		font-size: 1rem;
		line-height: 1.75rem;
		outline: none;
	}
	:global(.safelink-placeholder) {
		pointer-events: none;
		position: absolute;
		top: 1.25rem;
		left: 1.5rem;
		color: #71717a;
	}
	:global(.safelink-editor-paragraph) {
		margin: 0 0 1rem;
	}
	:global(.safelink-editor-h1) {
		margin: 0 0 1rem;
		font-size: 1.875rem;
		font-weight: 600;
	}
	:global(.safelink-editor-h2) {
		margin: 0 0 0.75rem;
		font-size: 1.5rem;
		font-weight: 600;
	}
	:global(.safelink-editor-h3) {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
	}
	:global(.safelink-editor-quote) {
		margin: 1rem 0;
		border-left: 4px solid #d4d4d8;
		padding-left: 1rem;
		color: #52525b;
	}
	:global(.safelink-editor-ul) {
		margin: 1rem 0;
		list-style: disc;
		padding-left: 1.5rem;
	}
	:global(.safelink-editor-ol) {
		margin: 1rem 0;
		list-style: decimal;
		padding-left: 1.5rem;
	}
	:global(.safelink-editor-link) {
		color: #2563eb;
		text-decoration: underline;
	}
	:global(.safelink-editor-bold) {
		font-weight: 700;
	}
	:global(.safelink-editor-italic) {
		font-style: italic;
	}
	:global(.safelink-editor-underline) {
		text-decoration: underline;
	}
	:global(.safelink-editor-strikethrough) {
		text-decoration: line-through;
	}
	:global(.safelink-editor-image) {
		margin: 1.5rem auto;
		max-width: 100%;
	}
</style>
