<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { alertDialog } from '$lib/stores/alert-dialog.svelte.js';
	import { cn } from '$lib/utils.js';
	import { CheckCircle2, Info, AlertTriangle, XCircle, Loader2 } from '@lucide/svelte';

	const iconMap = {
		success: CheckCircle2,
		info: Info,
		warning: AlertTriangle,
		error: XCircle
	} as const;

	const styleMap = {
		success: {
			iconColor: 'text-emerald-600 dark:text-emerald-500',
			bg: 'bg-emerald-100 dark:bg-emerald-500/10',
			action: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600'
		},
		info: {
			iconColor: 'text-blue-600 dark:text-blue-500',
			bg: 'bg-blue-100 dark:bg-blue-500/10',
			action: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600'
		},
		warning: {
			iconColor: 'text-amber-600 dark:text-amber-500',
			bg: 'bg-amber-100 dark:bg-amber-500/10',
			action: 'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-600'
		},
		error: {
			iconColor: 'text-red-600 dark:text-red-500',
			bg: 'bg-red-100 dark:bg-red-500/10',
			action: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600'
		}
	} as const;

	let Icon = $derived(iconMap[alertDialog.type]);
	let style = $derived(styleMap[alertDialog.type]);

	// Escape / klik di luar dianggap "cancel" — kecuali disableOutsideClose aktif
	function handleOpenChange(isOpen: boolean) {
		if (!isOpen && alertDialog.open) {
			alertDialog.handleCancel();
		}
	}
</script>

<AlertDialog.Root bind:open={alertDialog.open} onOpenChange={handleOpenChange}>
	<AlertDialog.Content
		escapeKeydownBehavior={alertDialog.disableOutsideClose ? 'ignore' : 'close'}
		interactOutsideBehavior={alertDialog.disableOutsideClose ? 'ignore' : 'close'}
	>
		<AlertDialog.Header>
			<div class="flex items-start gap-4">
				<div class={cn('flex size-10 shrink-0 items-center justify-center rounded-full', style.bg)}>
					<Icon class={cn('size-5', style.iconColor)} />
				</div>
				<div class="flex-1 space-y-1.5 pt-0.5 text-left">
					<AlertDialog.Title>{alertDialog.title}</AlertDialog.Title>
					{#if alertDialog.description}
						<AlertDialog.Description>
							{alertDialog.description}
						</AlertDialog.Description>
					{/if}
				</div>
			</div>
		</AlertDialog.Header>

		<AlertDialog.Footer>
			{#if alertDialog.showCancel}
				<AlertDialog.Cancel
					disabled={alertDialog.loading}
					onclick={() => alertDialog.handleCancel()}
				>
					{alertDialog.cancelText}
				</AlertDialog.Cancel>
			{/if}
			<AlertDialog.Action
				disabled={alertDialog.loading}
				class={cn(buttonVariants({ variant: 'default' }), style.action)}
				onclick={(e) => {
					e.preventDefault();
					alertDialog.handleConfirm();
				}}
			>
				{#if alertDialog.loading}
					<Loader2 class="mr-2 size-4 animate-spin text-primary" />
				{/if}
				{alertDialog.confirmText}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
