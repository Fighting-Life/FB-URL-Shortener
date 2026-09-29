<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRightIcon, ShieldCheckIcon } from '@lucide/svelte';
	import type { SafelinkTheme } from '$lib/server/safelink-document';

	let {
		title,
		html,
		theme,
		targetUrl,
		preview = false
	}: {
		title: string;
		html: string;
		theme: SafelinkTheme;
		targetUrl: string;
		preview?: boolean;
	} = $props();

	let remaining = $state(0);

	onMount(() => {
		remaining = theme.countdownSeconds;
		if (remaining <= 0) return;
		const interval = window.setInterval(() => {
			remaining = Math.max(0, remaining - 1);
			if (remaining === 0) window.clearInterval(interval);
		}, 1000);
		return () => window.clearInterval(interval);
	});
</script>

<main
	class="min-h-screen px-5 py-10 sm:py-16"
	style:background-color={theme.backgroundColor}
	style:color={theme.textColor}
>
	<article class="mx-auto w-full max-w-3xl">
		<header class="mb-8 border-b border-current/15 pb-6">
			<div class="mb-4 flex items-center gap-2 text-sm font-medium opacity-65">
				<ShieldCheckIcon class="size-4" aria-hidden="true" /> Secure destination
			</div>
			<h1 class="text-3xl font-semibold sm:text-4xl">{title}</h1>
		</header>

		<div
			class="safelink-content text-base leading-7 [&_a]:font-medium [&_a]:underline [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-current/25 [&_blockquote]:pl-5 [&_code]:rounded [&_code]:bg-black/5 [&_code]:px-1.5 [&_figure]:my-7 [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_hr]:my-8 [&_hr]:border-current/20 [&_img]:mx-auto [&_img]:max-h-[70vh] [&_img]:max-w-full [&_img]:rounded-md [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
		>
			{@html html}
		</div>

		<footer class="mt-10 border-t border-current/15 pt-6">
			{#if remaining > 0}
				<p class="mb-3 text-center text-sm opacity-65">
					Destination available in {remaining} second{remaining === 1 ? '' : 's'}
				</p>
			{/if}
			<a
				href={remaining === 0 && !preview ? targetUrl : undefined}
				aria-disabled={remaining > 0 || preview}
				class="mx-auto flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold text-white transition-opacity aria-disabled:pointer-events-none aria-disabled:opacity-45"
				style:background-color={theme.accentColor}
				rel="noreferrer"
			>
				{theme.ctaLabel}
				<ArrowRightIcon class="size-4" aria-hidden="true" />
			</a>
			{#if preview}
				<p class="mt-3 text-center text-xs opacity-55">CTA is disabled in preview mode.</p>
			{/if}
		</footer>
	</article>
</main>
