<script lang="ts">
	import { AppSidebarLayout } from '@/components/app';

	let { data } = $props();
</script>

<AppSidebarLayout page="Links" user={data.user} setting={data.setting}>
	<div class="space-y-6 px-1 sm:px-3"></div>
</AppSidebarLayout>
