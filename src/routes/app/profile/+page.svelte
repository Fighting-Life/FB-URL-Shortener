<script lang="ts">
	import * as UnderlineTabs from '$lib/components/ui/underline-tabs/index.js';
	import { AppSidebarLayout } from '@/components/app';
	import {
		AppAccountUpdateProfileForm,
		AppAccountUpdatePasswordForm,
		AppAccountEnable2FAForm
	} from '@/components/app/account';

	let { data } = $props();

	let tab = $state('profile');
</script>

<AppSidebarLayout page="Account & Security" user={data.user} setting={data.setting}>
	<div class="space-y-6 px-4 py-4 sm:px-6">
		<div class="rounded-md border-t border-border bg-card p-2 shadow-md">
			<UnderlineTabs.Root bind:value={tab} onValueChange={(tab) => (tab = tab)}>
				<UnderlineTabs.List>
					<UnderlineTabs.Trigger value="profile">Profile</UnderlineTabs.Trigger>
					<UnderlineTabs.Trigger value="password">Password</UnderlineTabs.Trigger>
					<UnderlineTabs.Trigger value="two_factor">2FA Authentication</UnderlineTabs.Trigger>
				</UnderlineTabs.List>
				<UnderlineTabs.Content value="profile">
					<AppAccountUpdateProfileForm user={data.user} form={data.profileForm} />
				</UnderlineTabs.Content>
				<UnderlineTabs.Content value="password">
					<AppAccountUpdatePasswordForm user={data.user} form={data.passwordForm} />
				</UnderlineTabs.Content>
				<UnderlineTabs.Content value="two_factor">
					<AppAccountEnable2FAForm user={data.user} form={data.twoFactorForm} />
				</UnderlineTabs.Content>
			</UnderlineTabs.Root>
		</div>
	</div>
</AppSidebarLayout>
