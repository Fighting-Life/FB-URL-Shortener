<script lang="ts">
	import {
		BoldIcon,
		ItalicIcon,
		LinkIcon,
		ListIcon,
		ListOrderedIcon,
		QuoteIcon,
		Redo2Icon,
		StrikethroughIcon,
		UnderlineIcon,
		Undo2Icon,
		UnlinkIcon
	} from '@lucide/svelte';
	import { TOGGLE_LINK_COMMAND } from '@lexical/link';
	import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
	import {
		$createHeadingNode as createHeadingNode,
		$createQuoteNode as createQuoteNode
	} from '@lexical/rich-text';
	import { $setBlocksType as setBlocksType } from '@lexical/selection';
	import {
		$createParagraphNode as createParagraphNode,
		$getSelection as getSelection,
		$isRangeSelection as isRangeSelection,
		FORMAT_TEXT_COMMAND,
		REDO_COMMAND,
		UNDO_COMMAND,
		type LexicalEditor
	} from 'lexical';
	import type { Snippet } from 'svelte';
	import { getActiveEditor, getBlockType, getIsLink } from 'slx/core/composerContext.js';

	const activeEditor = getActiveEditor();
	const blockType = getBlockType();
	const isLink = getIsLink();
	let { children }: { children?: Snippet } = $props();

	function setParagraph(editor: LexicalEditor) {
		editor.update(() => {
			const selection = getSelection();
			if (isRangeSelection(selection)) {
				setBlocksType(selection, () => createParagraphNode());
			}
		});
	}

	function setHeading(editor: LexicalEditor, size: 'h1' | 'h2' | 'h3') {
		editor.update(() => {
			const selection = getSelection();
			if (isRangeSelection(selection)) {
				setBlocksType(selection, () => createHeadingNode(size));
			}
		});
	}

	function setQuote(editor: LexicalEditor) {
		editor.update(() => {
			const selection = getSelection();
			if (isRangeSelection(selection)) {
				setBlocksType(selection, () => createQuoteNode());
			}
		});
	}

	function setBulletList(editor: LexicalEditor, currentBlock: string) {
		if (currentBlock === 'bullet') setParagraph(editor);
		else editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
	}

	function setNumberedList(editor: LexicalEditor, currentBlock: string) {
		if (currentBlock === 'number') setParagraph(editor);
		else editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
	}

	function setBlock(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		if (value === 'paragraph') setParagraph($activeEditor);
		else if (value === 'h1' || value === 'h2' || value === 'h3') setHeading($activeEditor, value);
		else if (value === 'bullet') setBulletList($activeEditor, $blockType);
		else if (value === 'number') setNumberedList($activeEditor, $blockType);
		else if (value === 'quote') setQuote($activeEditor);
	}

	function toggleLink() {
		if ($isLink) {
			$activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
			return;
		}
		const value = window.prompt('Link URL', 'https://');
		if (!value) return;
		try {
			const url = new URL(value);
			if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
			$activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, url.toString());
		} catch {
			// Invalid URLs are ignored and never enter the document.
		}
	}
</script>

<div class="flex min-h-11 flex-wrap items-center gap-1 border-b border-border p-1.5">
	<button
		type="button"
		class="tool-button"
		title="Undo"
		aria-label="Undo"
		onclick={() => $activeEditor.dispatchCommand(UNDO_COMMAND, undefined)}><Undo2Icon /></button
	>
	<button
		type="button"
		class="tool-button"
		title="Redo"
		aria-label="Redo"
		onclick={() => $activeEditor.dispatchCommand(REDO_COMMAND, undefined)}><Redo2Icon /></button
	>
	<span class="mx-1 h-6 w-px bg-border"></span>
	<select
		class="h-8 rounded-md border border-input bg-background px-2 text-xs"
		value={$blockType}
		onchange={setBlock}
		aria-label="Text block"
	>
		<option value="paragraph">Paragraph</option><option value="h1">Heading 1</option><option
			value="h2">Heading 2</option
		><option value="h3">Heading 3</option><option value="bullet">Bullet list</option><option
			value="number">Numbered list</option
		><option value="quote">Quote</option>
	</select>
	<span class="mx-1 h-6 w-px bg-border"></span>
	<button
		type="button"
		class="tool-button"
		title="Bold"
		aria-label="Bold"
		onclick={() => $activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}><BoldIcon /></button
	>
	<button
		type="button"
		class="tool-button"
		title="Italic"
		aria-label="Italic"
		onclick={() => $activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
		><ItalicIcon /></button
	>
	<button
		type="button"
		class="tool-button"
		title="Underline"
		aria-label="Underline"
		onclick={() => $activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
		><UnderlineIcon /></button
	>
	<button
		type="button"
		class="tool-button"
		title="Strikethrough"
		aria-label="Strikethrough"
		onclick={() => $activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
		><StrikethroughIcon /></button
	>
	<button
		type="button"
		class="tool-button"
		title={$isLink ? 'Remove link' : 'Add link'}
		aria-label={$isLink ? 'Remove link' : 'Add link'}
		onclick={toggleLink}
		>{#if $isLink}<UnlinkIcon />{:else}<LinkIcon />{/if}</button
	>
	<button
		type="button"
		class="tool-button"
		title="Bullet list"
		aria-label="Bullet list"
		onclick={() => setBulletList($activeEditor, $blockType)}><ListIcon /></button
	>
	<button
		type="button"
		class="tool-button"
		title="Numbered list"
		aria-label="Numbered list"
		onclick={() => setNumberedList($activeEditor, $blockType)}><ListOrderedIcon /></button
	>
	<button
		type="button"
		class="tool-button"
		title="Quote"
		aria-label="Quote"
		onclick={() => setQuote($activeEditor)}><QuoteIcon /></button
	>
	{@render children?.()}
</div>

<style>
	.tool-button {
		display: inline-flex;
		width: 2rem;
		height: 2rem;
		align-items: center;
		justify-content: center;
		border-radius: 0.375rem;
	}
	.tool-button:hover {
		background: var(--muted);
	}
	.tool-button :global(svg) {
		width: 1rem;
		height: 1rem;
	}
</style>
