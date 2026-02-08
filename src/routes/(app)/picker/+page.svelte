<script lang="ts">
	const routeInfo: Record<string, { title: string; icon: string; desc: string }> = {
		collection: { title: 'My Games', icon: '📦', desc: 'Your board game collection will appear here.' },
		import: { title: 'Import Games', icon: '📥', desc: 'Import from BoardGameGeek or search to add games.' },
		picker: { title: 'Pick a Game', icon: '🎯', desc: 'Filter and randomize — what should we play tonight?' },
		'game-night': { title: 'Game Night', icon: '🌙', desc: 'Log plays in under 10 seconds.' },
		stats: { title: 'Stats', icon: '📊', desc: 'Play statistics and insights. Pro feature coming soon!' },
		wishlist: { title: 'Wishlist', icon: '💫', desc: 'Games you want. Pro feature coming soon!' },
		settings: { title: 'Settings', icon: '⚙️', desc: 'Account settings and preferences.' },
	};

	// Get current route name from the URL
	import { page } from '$app/stores';
	const routeName = $derived($page.url.pathname.split('/').pop() || 'collection');
	const info = $derived(routeInfo[routeName] || routeInfo.collection);
</script>

<svelte:head>
	<title>{info.title} — ShelfLife</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl md:text-3xl font-bold flex items-center gap-3">
			<span>{info.icon}</span>
			{info.title}
		</h1>
		<p class="text-text-secondary mt-1">{info.desc}</p>
	</div>

	<div class="text-center py-16 rounded-[var(--radius-card)] bg-surface-50 border border-surface-200 border-dashed">
		<div class="text-5xl mb-4">{info.icon}</div>
		<h3 class="text-lg font-semibold mb-2">Coming in the next step!</h3>
		<p class="text-text-secondary text-sm">We're building this baby step by baby step.</p>
	</div>
</div>
