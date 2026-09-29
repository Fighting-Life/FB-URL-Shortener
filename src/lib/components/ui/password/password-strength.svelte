<script lang="ts">
	import { tv } from 'tailwind-variants';
	import { usePasswordStrength } from './password.svelte.js';
	import type { PasswordStrengthProps } from './types.js';
	import { Meter } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { box } from 'svelte-toolbelt';

	let { strength = $bindable(), class: className }: PasswordStrengthProps = $props();

	usePasswordStrength({
		strength: box.with(
			() => strength,
			(v) => (strength = v)
		)
	});

	const score = $derived(strength?.score ?? 0);

	const color = tv({
		base: '',
		variants: {
			score: {
				0: 'bg-red-500',
				1: 'bg-red-500',
				2: 'bg-yellow-500',
				3: 'bg-yellow-500',
				4: 'bg-green-500'
			}
		}
	});
</script>

<Meter.Root
	value={score}
	class={cn('relative h-1.5 w-full gap-1 overflow-hidden rounded-full bg-accent', className)}
	min={0}
	max={4}
>
	<div
		class={cn('h-full transition-all duration-500', color({ score }))}
		style="width: {(score / 4) * 100}%;"
	></div>
	<!-- This creates the gaps between the bars -->
	<div class="absolute top-0 left-0 z-10 flex h-1.5 w-full place-items-center gap-1">
		{#each Array.from({ length: 4 }) as _, i (i)}
			<div class="h-1.5 w-1/4 rounded-full ring-3 ring-background"></div>
		{/each}
	</div>
</Meter.Root>
