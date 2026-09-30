<script lang="ts">
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Textarea } from '@/components/ui/textarea';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Spinner } from '@/components/ui/spinner';
	import { Badge } from '@/components/ui/badge';
	import { Button } from '@/components/ui/button';
	import Mail from '@lucide/svelte/icons/mail';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import BookOpen from '@lucide/svelte/icons/book-open';

	let name = $state('');
	let email = $state('');
	let topic = $state('General question');
	let message = $state('');
	let sent = $state(false);
	let loading = $state(false);

	const topics = ['General question', 'Technical support', 'Report abuse', 'Partnership'];

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		setTimeout(() => {
			loading = false;
			sent = true;
		}, 800);
	}
</script>

<section class="mx-auto max-w-5xl px-5 py-20">
	<Badge variant="default">Contact</Badge>
	<h1
		class="mt-5 max-w-lg font-display text-4xl leading-tight font-semibold text-balance text-ink dark:text-paper"
	>
		Question about a redirect rule? We can help.
	</h1>

	<div class="mt-14 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
		<div class="space-y-8">
			<div class="flex gap-4">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal/10 text-signal"
				>
					<Mail size={18} />
				</div>
				<div>
					<h3 class="font-display text-sm font-semibold text-ink dark:text-paper">Email us</h3>
					<p class="mt-1 text-sm text-muted-foreground">support@Bitfy.example</p>
					<p class="text-sm text-muted-foreground">Replies within one business day.</p>
				</div>
			</div>
			<div class="flex gap-4">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal/10 text-signal"
				>
					<BookOpen size={18} />
				</div>
				<div>
					<h3 class="font-display text-sm font-semibold text-ink dark:text-paper">
						Check the docs first
					</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						Most rotation and blocking-rule questions are already answered.
					</p>
					<a href="/docs" class="mt-1 inline-block text-sm font-medium text-signal hover:underline">
						Browse documentation
					</a>
				</div>
			</div>
			<div class="flex gap-4">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal/10 text-signal"
				>
					<MessageSquare size={18} />
				</div>
				<div>
					<h3 class="font-display text-sm font-semibold text-ink dark:text-paper">FAQ</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						Common questions about limits, blocking, and billing.
					</p>
					<a href="/faq" class="mt-1 inline-block text-sm font-medium text-signal hover:underline">
						Read the FAQ
					</a>
				</div>
			</div>
		</div>

		<div
			class="rounded-2xl border border-line-light bg-white p-7 sm:p-9 dark:border-line-dark dark:bg-ink-dim"
		>
			{#if sent}
				<div class="py-8 text-center">
					<h3 class="font-display text-xl font-semibold text-ink dark:text-paper">Message sent</h3>
					<p class="mt-2 text-sm text-muted-foreground">
						Thanks, {name || 'there'} — we'll reply at {email}.
					</p>
				</div>
			{:else}
				<form onsubmit={handleSubmit} class="space-y-5">
					<Field.Group>
						<div class="grid gap-5 sm:grid-cols-2">
							<Field.Field>
								<Label for="name">Name</Label>
								<Input
									bind:value={name}
									name="name"
									autocomplete="name"
									placeholder="Your name"
									required
									disabled={loading}
								/>
							</Field.Field>
							<Field.Field>
								<Label for="email">Email</Label>
								<Input
									bind:value={email}
									type="email"
									name="email"
									autocomplete="email"
									placeholder="you@company.com"
									required
									disabled={loading}
								/>
							</Field.Field>
						</div>
						<Field.Field>
							<Label for="topic">Topic</Label>
							<Select.Root type="single" bind:value={topic} name="topic" disabled={loading}>
								<Select.Trigger class="w-full">
									{topics.find((t) => t === topic) || 'Select a topic'}
								</Select.Trigger>
								<Select.Content class="w-full">
									<Select.Group>
										{#each topics as t, i (i)}
											<Select.Item value={t}>{t}</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						</Field.Field>
						<Field.Field>
							<Label for="message">Message</Label>
							<Textarea
								bind:value={message}
								name="message"
								rows={5}
								placeholder="What's going on?"
								autocomplete="on"
								disabled={loading}
							/>
						</Field.Field>
						<Field.Field>
							<Button type="submit" class="w-full" size="lg" disabled={loading}>
								{#if loading}
									<Spinner />
								{/if}
								{loading ? 'Sending…' : 'Send message'}
							</Button>
						</Field.Field>
					</Field.Group>
				</form>
			{/if}
		</div>
	</div>
</section>
