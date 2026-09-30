<script lang="ts">
	import { page } from '$app/state';
	import { MetaTags, deepMerge } from 'svelte-meta-tags';
	import './layout.css';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { ModeWatcher } from 'mode-watcher';
	import { ToastContent } from '@/components/extra/toast/index.js';
	import { SvelteKitTopLoader } from 'sveltekit-top-loader';
	import { AppGlobalAlertDialog } from '@/components/extra/index.js';

	let { data, children } = $props();

	let metaTags = $derived(deepMerge(data.baseMetaTags, page.data.pageMetaTags));
</script>

<MetaTags {...metaTags} />
<ModeWatcher />
<ToastContent />
<SvelteKitTopLoader color="#1447e6" />

<QueryClientProvider client={data.queryClient}>
	<main class="min-h-screen antialiased">
		<AppGlobalAlertDialog />
		{@render children?.()}
	</main>
</QueryClientProvider>
