<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { ChevronRightIcon } from '@lucide/svelte';

	let {
		items
	}: {
		items: NavMenu[];
	} = $props();

	let selectedParentIndex = $state<number | null>(null);
	let selectedChildIndex = $state<number | null>(null);

	const toggleCollapse = (index: number) => {
		if (selectedParentIndex === index) {
			selectedParentIndex = null;
			selectedChildIndex = null;
		} else {
			selectedParentIndex = index;
			selectedChildIndex = null;
		}
	};
</script>

<Sidebar.Group>
	<Sidebar.GroupContent class="px-1.5 md:px-0">
		<Sidebar.Menu>
			{#each items as item, index (index)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						tooltipContent={item.title}
						onclick={() => toggleCollapse(index)}
						class={item.url === page.url.pathname ? 'bg-primary hover:bg-primary/80' : ''}
					>
						{#snippet child({ props })}
							<a {...props} href={item.url}>
								{#if item.icon}
									<item.icon class={item.url === page.url.pathname ? 'font-bold text-white' : ''} />
								{/if}
								<span class={item.url === page.url.pathname ? 'font-bold text-white' : ''}>
									{item.title}
								</span>
								{#if item.items?.length}
									<ChevronRightIcon
										class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
									/>
								{/if}
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
