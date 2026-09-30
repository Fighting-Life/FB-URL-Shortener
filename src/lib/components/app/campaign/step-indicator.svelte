<script lang="ts">
	let {
		currentStep,
		totalSteps,
		steps
	}: {
		currentStep: number;
		totalSteps: number;
		steps: string[];
	} = $props();
</script>

<div class="mb-6 w-full">
	<div class="flex items-center justify-between">
		{#each steps as label, i (i)}
			{@const stepNum = i + 1}
			{@const isCompleted = stepNum < currentStep}
			{@const isActive = stepNum === currentStep}
			<div class="flex flex-1 flex-col items-center">
				<div class="relative flex w-full items-center">
					{#if i > 0}
						<div
							class="h-0.5 flex-1 transition-colors {isCompleted ? 'bg-primary' : 'bg-border'}"
						></div>
					{:else}
						<div class="flex-1"></div>
					{/if}
					<button
						type="button"
						class="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors
							{isCompleted
							? 'bg-primary text-primary-foreground'
							: isActive
								? 'border-2 border-primary bg-background text-primary'
								: 'border-2 border-border bg-background text-muted-foreground'}"
						aria-label="Step {stepNum}: {label}"
						aria-current={isActive ? 'step' : undefined}
					>
						{#if isCompleted}
							<svg
								class="size-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
							>
								<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						{:else}
							{stepNum}
						{/if}
					</button>
					{#if i < totalSteps - 1}
						<div
							class="h-0.5 flex-1 transition-colors {isCompleted ? 'bg-primary' : 'bg-border'}"
						></div>
					{:else}
						<div class="flex-1"></div>
					{/if}
				</div>
				<span
					class="mt-2 hidden text-center text-xs sm:block {isActive
						? 'font-semibold text-foreground'
						: isCompleted
							? 'text-primary'
							: 'text-muted-foreground'}"
				>
					{label}
				</span>
			</div>
		{/each}
	</div>
</div>
