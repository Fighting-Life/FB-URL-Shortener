<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { authClient } from '@/client/auth.js';
	import { cn } from '$lib/utils.js';
	import { LogOut, UserIcon, Lock } from '@lucide/svelte';

	let { page, user }: { page?: string; user?: User | null } = $props();

	async function logout() {
		await authClient.signOut();
		const redirectTarget = `${window.location.pathname}${window.location.search}`;
		const signInHref = `/signin?redirect=${encodeURIComponent(redirectTarget)}`;
		window.location.assign(signInHref);
	}
</script>

<header
	class={cn(
		'flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12',
		'sticky top-0 z-50 overflow-hidden rounded-t-[inherit] bg-background/50 backdrop-blur-md'
	)}
>
	<div class="flex w-full items-center justify-between px-4 lg:px-6">
		<div class="flex items-center gap-1 lg:gap-2">
			<Sidebar.Trigger class="-ml-1 lg:hidden" />
			<h1 class="text-base font-medium">{page}</h1>
		</div>

		<div class="flex items-center gap-2">
			<LightSwitch />
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="ghost">
							<Avatar.Root>
								<Avatar.Image src={user?.image || ''} alt={user?.name} />
								<Avatar.Fallback class="rounded-lg">
									{user?.name?.slice(0, 2).toUpperCase() || 'CN'}
								</Avatar.Fallback>
							</Avatar.Root>
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content class="min-w-max p-3" align="end">
					<div class="flex items-center gap-2">
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={user?.image || ''} alt={user?.name} />
							<Avatar.Fallback class="rounded-lg">
								{user?.name?.slice(0, 2).toUpperCase() || 'CN'}
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{user?.name}</span>
							<span class="truncate text-xs text-muted-foreground">{user?.email}</span>
						</div>
					</div>
					<DropdownMenu.Separator />
					<DropdownMenu.Group>
						<DropdownMenu.Item class="w-full text-sm" onSelect={() => goto('/app/profile')}>
							<UserIcon class="size-4" />
							Account & Security
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item class="w-full text-sm" variant="destructive" onSelect={logout}>
							<LogOut class="size-4" />
							Logout
						</DropdownMenu.Item>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>
</header>
