<script lang="ts">
	import { HomeNavbar, HomeFooter } from '$lib/components/landing/index';

	let { data, children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-background">
	<HomeNavbar user={data.user} />
	<main class="flex-1">
		{@render children()}
	</main>
	<HomeFooter />
</div>
