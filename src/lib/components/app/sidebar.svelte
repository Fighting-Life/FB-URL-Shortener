<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { AppNavMain, AppNavUser } from '$lib/components/app/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import {
		LayoutDashboard,
		UserRound,
		Settings,
		Link,
		ScrollText,
		UsersRound,
		Globe2
	} from '@lucide/svelte';

	let {
		ref = $bindable(null),
		collapsible = 'icon',
		user,
		setting,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		user?: User | null;
		setting?: SiteSetting | null;
	} = $props();

	const sidebar = useSidebar();
	let isMobilePage = new IsMobile();

	const isSuperAdmin = $derived.by(() => user?.role === 'superadmin');
	const isModerator = $derived.by(() => user?.role === 'moderator' || user?.role === 'superadmin');

	const navMain: NavMenu[] = [
		...[
			{
				title: 'Dashboard',
				url: '/app',
				icon: LayoutDashboard
			},
			{
				title: 'Links',
				url: '/app/links',
				icon: Link
			},
			{
				title: 'Teams',
				url: '/app/teams',
				icon: UsersRound
			},
			{
				title: 'Domains',
				url: '/app/domains',
				icon: Globe2
			}
		],
		// svelte-ignore state_referenced_locally
		...(isModerator
			? [
					{
						title: 'Users',
						url: '/app/users',
						icon: UserRound
					},
					{
						title: 'Audit log',
						url: '/app/audit',
						icon: ScrollText
					}
				]
			: [])
	];
	const navSecondary: NavMenu[] = [
		{
			title: 'Settings',
			url: '/app/settings',
			icon: Settings
		}
	];
</script>

<Sidebar.Root bind:ref collapsible="icon" {...restProps}>
	<Sidebar.Root collapsible="none" class="w-[calc(var(--sidebar-width-icon)+1px)]! border-e">
		<Sidebar.Header>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton size="lg" class="md:h-8 md:p-0">
						{#snippet child({ props })}
							<a href="/app" {...props}>
								{#if isMobilePage.current}
									<img
										src={setting?.site_logo || '/logo.png'}
										alt={setting?.site_name || 'Link Shift'}
										class="h-10 w-10 object-cover"
									/>
									<div class="text-left">
										<p
											class="text-sm font-semibold tracking-[0.24em] text-muted-foreground uppercase"
										>
											{setting?.site_name || 'Link Shift'}
										</p>
										<p class="text-xs text-foreground/80">{setting?.site_tagline || ''}</p>
									</div>
								{:else}
									<img
										src={setting?.site_logo || '/logo.png'}
										alt={setting?.site_name || 'Link Shift'}
										class="aspect-square size-7 object-cover select-none"
									/>
								{/if}
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Header>
		<Sidebar.Content class="scrollbar-primary overflow-y-auto">
			<AppNavMain items={navMain} />
			{#if isSuperAdmin}
				<Sidebar.Separator />
				<AppNavMain items={navSecondary} />
			{/if}
		</Sidebar.Content>
		<Sidebar.Footer>
			<AppNavUser {user} />
		</Sidebar.Footer>
		<Sidebar.Rail />
	</Sidebar.Root>
</Sidebar.Root>
