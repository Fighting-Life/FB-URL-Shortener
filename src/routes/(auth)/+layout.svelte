<script lang="ts">
	import type { Snippet } from 'svelte';
	import { LightSwitch } from '$lib/components/ui/light-switch/index';

	let { children } = $props();
</script>

<div class="grid min-h-screen lg:grid-cols-2">
	<!-- Form column -->
	<div class="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
		<div class="flex items-center justify-between">
			<a href="/" class="flex items-center gap-2">
				<img src="/logo.png" alt="Bitfy" class="h-6 w-6 object-cover" />
				<span class="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">
					Bitfy
				</span>
			</a>
			<LightSwitch />
		</div>
		<div class="flex flex-1 items-center py-10">
			<div class="mx-auto w-full max-w-sm">
				{@render children()}
			</div>
		</div>
	</div>

	<!-- Visual column -->
	<div
		class="relative hidden overflow-hidden bg-linear-to-br from-ink via-blue-900/80 to-ink lg:block"
	>
		<div
			class="absolute inset-0 opacity-[0.07]"
			style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 28px 28px;"
		></div>

		<div class="relative flex h-full flex-col justify-between p-14">
			<div></div>

			<svg
				viewBox="0 0 400 260"
				class="w-full max-w-md"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="40" cy="130" r="7" class="fill-paper" />
				<circle cx="220" cy="40" r="5" class="fill-signal" />
				<circle cx="220" cy="130" r="5" class="fill-signal" />
				<circle cx="220" cy="220" r="5" class="fill-line-dark" />
				<circle cx="370" cy="40" r="4" class="fill-paper/40" />
				<circle cx="370" cy="220" r="4" class="fill-ember" />

				<path d="M47 127 L215 41" stroke="white" stroke-opacity="0.25" stroke-width="1.5" />
				<path d="M47 130 L215 130" stroke="white" stroke-opacity="0.5" stroke-width="1.5" />
				<path
					d="M47 133 L215 218"
					stroke="white"
					stroke-opacity="0.25"
					stroke-width="1.5"
					stroke-dasharray="2 4"
				/>
				<path d="M225 40 L366 40" stroke="white" stroke-opacity="0.25" stroke-width="1.5" />
				<path
					d="M225 220 L366 220"
					stroke="#FF6B4A"
					stroke-opacity="0.6"
					stroke-width="1.5"
					stroke-dasharray="2 4"
				/>
			</svg>

			<div class="max-w-sm">
				<p class="font-display text-2xl leading-snug font-medium text-paper">
					One link in, the right destination out — every time.
				</p>
				<p class="mt-3 text-sm text-paper/50">
					Rotation, device rules, and referrer checks run before every redirect, automatically.
				</p>
			</div>
		</div>
	</div>
</div>
