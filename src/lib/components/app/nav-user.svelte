<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '../ui/button';
	import { authClient } from '@/client/auth.js';
	import { EllipsisVertical, LogOut, UserIcon, Lock } from '@lucide/svelte';

	let { user }: { user?: User | null } = $props();
	const sidebar = Sidebar.useSidebar();

	async function logout() {
		await authClient.signOut();
		const redirectTarget = `${window.location.pathname}${window.location.search}`;
		const signInHref = `/signin?redirect=${encodeURIComponent(redirectTarget)}`;
		window.location.assign(signInHref);
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<Avatar.Root class="size-8 rounded-lg bg-primary">
							<Avatar.Image src={user?.image || ''} alt={user?.name} />
							<Avatar.Fallback class="rounded-lg text-white">
								{user?.name?.slice(0, 2).toUpperCase() || 'CN'}
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{user?.name}</span>
							<span class="truncate text-xs text-muted-foreground">
								{user?.email}
							</span>
						</div>
						<EllipsisVertical class="ml-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={user?.image || ''} alt={user?.name} />
							<Avatar.Fallback class="rounded-lg">
								{user?.name?.slice(0, 2).toUpperCase() || 'CN'}
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{user?.name}</span>
							<span class="truncate text-xs text-muted-foreground">
								{user?.email}
							</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item class="w-full text-sm" onSelect={() => goto('/app/profile')}>
						<UserIcon class="size-4" />
						Account & Security
					</DropdownMenu.Item>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />

				<DropdownMenu.Item class="w-full">
					{#snippet child()}
						<Button
							type="button"
							variant="ghost"
							class="w-full text-sm text-red-600 dark:text-red-500"
							onclick={logout}
						>
							<LogOut class="size-4" />
							Logout
						</Button>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
