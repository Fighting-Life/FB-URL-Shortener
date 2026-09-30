<script lang="ts">
	import { Badge } from '@/components/ui/badge';

	const featured = {
		title: 'Why we route bot detection through Playwright instead of user-agent strings',
		excerpt:
			'User-agent sniffing breaks the moment a script sets a normal-looking header. Here is why a real browser check catches more, and costs less than it sounds.',
		date: 'Aug 12, 2026',
		readTime: '7 min read',
		category: 'Engineering'
	};

	const posts = [
		{
			title: 'A practical guide to weighted link rotation',
			excerpt: 'How to split traffic across offers without starving the ones that convert best.',
			date: 'Jul 28, 2026',
			readTime: '5 min read',
			category: 'Guides'
		},
		{
			title: 'Blocking by device vs. blocking by browser: when to use which',
			excerpt: 'They catch different traffic. Most setups need both, but not for the same reasons.',
			date: 'Jul 14, 2026',
			readTime: '4 min read',
			category: 'Guides'
		},
		{
			title: 'Safelink pages: what they actually protect against',
			excerpt: 'Clearing a referrer sounds small until you see what leaks without it.',
			date: 'Jun 30, 2026',
			readTime: '6 min read',
			category: 'Engineering'
		},
		{
			title: 'Deeplinks that fall back gracefully, without a bounce',
			excerpt:
				'The difference between an app link that works and one that just looks like it does.',
			date: 'Jun 9, 2026',
			readTime: '5 min read',
			category: 'Guides'
		},
		{
			title: 'Reading a click log: IP, referrer, and what to ignore',
			excerpt: 'Not every field in a click record is signal. Here is what to actually watch.',
			date: 'May 22, 2026',
			readTime: '6 min read',
			category: 'Engineering'
		},
		{
			title: 'Setting up your first rotation in under five minutes',
			excerpt: 'A walkthrough of adding destinations, weights, and a fallback rule from scratch.',
			date: 'May 3, 2026',
			readTime: '3 min read',
			category: 'Guides'
		}
	];
</script>

<section class="mx-auto max-w-6xl px-5 py-20">
	<Badge variant="default">Blog</Badge>
	<h1 class="mt-5 font-display text-4xl font-semibold text-ink dark:text-paper">
		Notes on routing traffic well
	</h1>

	<a
		href="/blog"
		class="group mt-12 grid gap-6 rounded-2xl border border-line-light p-7 transition-colors hover:border-signal/40 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end dark:border-line-dark"
	>
		<div>
			<div class="flex items-center gap-3 text-xs text-muted-foreground">
				<span class="font-mono">{featured.category}</span>
				<span>·</span>
				<span>{featured.date}</span>
				<span>·</span>
				<span>{featured.readTime}</span>
			</div>
			<h2
				class="mt-4 max-w-xl font-display text-2xl font-semibold text-balance text-ink group-hover:text-signal sm:text-3xl dark:text-paper"
			>
				{featured.title}
			</h2>
			<p class="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">{featured.excerpt}</p>
		</div>
	</a>

	<div class="mt-14 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
		{#each posts as post, i (i)}
			<a href="/blog" class="group block">
				<div class="flex items-center gap-3 text-xs text-muted-foreground">
					<span class="font-mono">{post.category}</span>
					<span>·</span>
					<span>{post.readTime}</span>
				</div>
				<h3
					class="mt-3 font-display text-lg leading-snug font-semibold text-ink group-hover:text-signal dark:text-paper"
				>
					{post.title}
				</h3>
				<p class="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
				<p class="mt-3 text-xs text-muted-foreground">{post.date}</p>
			</a>
		{/each}
	</div>
</section>
