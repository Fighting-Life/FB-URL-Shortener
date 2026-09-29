<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { AppSidebar, AppSidebarHeader } from '$lib/components/app/index.js';
	import { cn } from '$lib/utils.js';

	let {
		user,
    setting,
		page,
		children
	}: {
		user?: User | null;
    setting?: SiteSetting | null;
		page?: string;
		children?: Snippet<[]>;
	} = $props();
</script>

<Sidebar.Provider open={false}>
	<AppSidebar {user} {setting} />
	<Sidebar.Inset
		class={cn(
			'mx-auto! lg:max-w-full',
			'max-[113rem]:peer-data-[variant=inset]:mr-2! min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:mr-auto!'
		)}
	>
		<AppSidebarHeader {page} {user} />
		<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
			<div class="@container/main flex flex-1 flex-col gap-2">
				<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
					<div
						class="scrollbar-thin flex min-h-[calc(100vh-160px)] scrollbar-thumb-foreground scrollbar-track-accent flex-col overflow-hidden overflow-y-auto scroll-smooth"
					>
						{@render children?.()}
					</div>
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
