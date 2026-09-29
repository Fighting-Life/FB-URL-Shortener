<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<a href="/" class={`inline-flex items-center gap-2.5 ${className}`}>
	<svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
		<circle cx="5" cy="13" r="3.2" class="fill-ink dark:fill-paper" />
		<circle cx="21" cy="5" r="2.6" class="fill-signal" />
		<circle
			cx="21"
			cy="21"
			r="2.6"
			class="fill-line-light dark:fill-line-dark"
			stroke="currentColor"
			stroke-width="0"
		/>
		<path d="M8 12 L18.5 6.3" class="stroke-ink dark:stroke-paper" stroke-width="1.4" />
		<path
			d="M8 14.2 L18.5 19.9"
			class="stroke-ink/30 dark:stroke-paper/30"
			stroke-width="1.4"
			stroke-dasharray="1 2.6"
		/>
	</svg>
	<span class="font-display text-[17px] font-semibold tracking-tight text-ink dark:text-paper">
		LinkShift
	</span>
</a>
