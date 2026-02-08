<script lang="ts">
	import { db, removeFromCollection, type LocalGame, type LocalCollectionGame } from '$lib/db/schema';
	import { liveQuery } from 'dexie';
	import { onMount } from 'svelte';

	// ============================================
	// State
	// ============================================
	let searchFilter = $state('');
	let playerFilter = $state<number | null>(null);
	let timeFilter = $state<number | null>(null);
	let viewMode = $state<'grid' | 'list'>('grid');
	let mounted = $state(false);

	// All collection items with game data joined
	let allItems = $state<(LocalCollectionGame & { game: LocalGame })[]>([]);

	onMount(() => {
		mounted = true;
		const sub = liveQuery(async () => {
			const collectionItems = await db.collection.where('status').equals('owned').toArray();
			const results = [];
			for (const item of collectionItems) {
				const game = await db.games.where('bggId').equals(item.bggId).first();
				if (game) results.push({ ...item, game });
			}
			return results;
		}).subscribe((items) => {
			allItems = items;
		});
		return () => sub.unsubscribe();
	});

	// Filtered + sorted items
	let filteredItems = $derived.by(() => {
		let items = allItems;

		// Search filter
		if (searchFilter.trim()) {
			const q = searchFilter.toLowerCase();
			items = items.filter(i => i.game.name.toLowerCase().includes(q));
		}

		// Player count filter
		if (playerFilter) {
			items = items.filter(i => {
				if (!i.game.minPlayers || !i.game.maxPlayers) return true;
				return playerFilter! >= i.game.minPlayers && playerFilter! <= i.game.maxPlayers;
			});
		}

		// Max playtime filter
		if (timeFilter) {
			items = items.filter(i => {
				if (!i.game.playingTime) return true;
				return i.game.playingTime <= timeFilter!;
			});
		}

		// Sort alphabetically
		return [...items].sort((a, b) => a.game.name.localeCompare(b.game.name));
	});

	// ============================================
	// Actions
	// ============================================
	let removingBggId = $state<number | null>(null);

	async function handleRemove(bggId: number, name: string) {
		if (!confirm(`Remove "${name}" from your collection?`)) return;
		removingBggId = bggId;
		try {
			await removeFromCollection(bggId);
		} finally {
			removingBggId = null;
		}
	}

	function clearFilters() {
		searchFilter = '';
		playerFilter = null;
		timeFilter = null;
	}

	const hasFilters = $derived(searchFilter.trim() !== '' || playerFilter !== null || timeFilter !== null);
</script>

<svelte:head>
	<title>My Games — ShelfLife</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl md:text-3xl font-bold flex items-center gap-3">
				<span>📦</span> My Games
			</h1>
			<p class="text-text-secondary mt-1">
				{allItems.length} game{allItems.length !== 1 ? 's' : ''} on your shelf
				{#if hasFilters && filteredItems.length !== allItems.length}
					<span class="text-brand-400">· {filteredItems.length} shown</span>
				{/if}
			</p>
		</div>

		<!-- View toggle + Import link -->
		<div class="flex items-center gap-3">
			<div class="flex rounded-lg overflow-hidden border border-surface-300">
				<button
					onclick={() => viewMode = 'grid'}
					class="px-3 py-1.5 text-sm {viewMode === 'grid' ? 'bg-brand-600 text-white' : 'bg-surface-100 text-text-secondary hover:text-text-primary'} transition-colors"
				>
					Grid
				</button>
				<button
					onclick={() => viewMode = 'list'}
					class="px-3 py-1.5 text-sm {viewMode === 'list' ? 'bg-brand-600 text-white' : 'bg-surface-100 text-text-secondary hover:text-text-primary'} transition-colors"
				>
					List
				</button>
			</div>
			<a
				href="/import"
				class="px-4 py-2 rounded-[var(--radius-button)] bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
			>
				+ Add Games
			</a>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap gap-3">
		<!-- Search -->
		<div class="relative flex-1 min-w-[200px]">
			<input
				type="text"
				bind:value={searchFilter}
				placeholder="Search your games..."
				class="w-full px-4 py-2.5 pl-9 rounded-[var(--radius-button)] bg-surface-100 border border-surface-300 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
			/>
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
		</div>

		<!-- Player count -->
		<select
			bind:value={playerFilter}
			class="px-4 py-2.5 rounded-[var(--radius-button)] bg-surface-100 border border-surface-300 text-text-primary text-sm focus:outline-none focus:border-brand-500 appearance-none cursor-pointer"
		>
			<option value={null}>Any players</option>
			<option value={1}>1 player</option>
			<option value={2}>2 players</option>
			<option value={3}>3 players</option>
			<option value={4}>4 players</option>
			<option value={5}>5 players</option>
			<option value={6}>6+ players</option>
		</select>

		<!-- Max time -->
		<select
			bind:value={timeFilter}
			class="px-4 py-2.5 rounded-[var(--radius-button)] bg-surface-100 border border-surface-300 text-text-primary text-sm focus:outline-none focus:border-brand-500 appearance-none cursor-pointer"
		>
			<option value={null}>Any time</option>
			<option value={15}>15 min or less</option>
			<option value={30}>30 min or less</option>
			<option value={60}>1 hour or less</option>
			<option value={90}>90 min or less</option>
			<option value={120}>2 hours or less</option>
		</select>

		{#if hasFilters}
			<button
				onclick={clearFilters}
				class="px-3 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
			>
				Clear filters
			</button>
		{/if}
	</div>

	<!-- ============================================ -->
	<!-- EMPTY STATE -->
	<!-- ============================================ -->
	{#if mounted && allItems.length === 0}
		<div class="text-center py-16 rounded-[var(--radius-card)] bg-surface-50 border border-surface-200 border-dashed">
			<div class="text-5xl mb-4">📦</div>
			<h3 class="text-xl font-semibold mb-2">No games yet!</h3>
			<p class="text-text-secondary mb-6 max-w-md mx-auto">
				Import your collection from BoardGameGeek or search to add games one by one.
			</p>
			<a
				href="/import"
				class="inline-flex px-6 py-3 rounded-[var(--radius-button)] bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors"
			>
				Import Your Games
			</a>
		</div>

	<!-- ============================================ -->
	<!-- NO FILTER RESULTS -->
	<!-- ============================================ -->
	{:else if filteredItems.length === 0 && hasFilters}
		<div class="text-center py-12 rounded-[var(--radius-card)] bg-surface-50 border border-surface-200">
			<div class="text-4xl mb-3">🔍</div>
			<h3 class="text-lg font-semibold mb-1">No matches</h3>
			<p class="text-text-secondary text-sm mb-4">No games match your current filters.</p>
			<button
				onclick={clearFilters}
				class="text-sm text-brand-400 hover:text-brand-300 transition-colors"
			>
				Clear all filters
			</button>
		</div>

	<!-- ============================================ -->
	<!-- GRID VIEW -->
	<!-- ============================================ -->
	{:else if viewMode === 'grid'}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
			{#each filteredItems as item (item.bggId)}
				<div class="group rounded-[var(--radius-card)] bg-surface-50 border border-surface-200 overflow-hidden hover:border-brand-600/30 hover:shadow-[var(--shadow-card-hover)] transition-all">
					<!-- Game Image -->
					<div class="aspect-square bg-surface-100 relative overflow-hidden">
						{#if item.game.thumbnailUrl}
							<img
								src={item.game.thumbnailUrl}
								alt={item.game.name}
								class="w-full h-full object-cover"
								loading="lazy"
							/>
						{:else}
							<div class="w-full h-full flex items-center justify-center text-4xl text-text-muted">
								🎲
							</div>
						{/if}

						<!-- Hover overlay with remove button -->
						<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
							<button
								onclick={() => handleRemove(item.bggId, item.game.name)}
								disabled={removingBggId === item.bggId}
								class="px-3 py-1.5 rounded-md bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium transition-colors"
							>
								Remove
							</button>
						</div>
					</div>

					<!-- Game Info -->
					<div class="p-3">
						<h3 class="font-semibold text-sm leading-tight line-clamp-2">{item.game.name}</h3>
						<div class="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-text-muted">
							{#if item.game.yearPublished}
								<span>{item.game.yearPublished}</span>
							{/if}
							{#if item.game.minPlayers && item.game.maxPlayers}
								<span>{item.game.minPlayers}-{item.game.maxPlayers}p</span>
							{/if}
							{#if item.game.playingTime}
								<span>{item.game.playingTime}m</span>
							{/if}
						</div>
						{#if item.game.bggRating}
							<div class="mt-1.5 flex items-center gap-1">
								<span class="text-yellow-500 text-xs">★</span>
								<span class="text-xs font-medium tabular-nums">{item.game.bggRating.toFixed(1)}</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

	<!-- ============================================ -->
	<!-- LIST VIEW -->
	<!-- ============================================ -->
	{:else}
		<div class="space-y-2">
			{#each filteredItems as item (item.bggId)}
				<div class="flex items-center gap-4 px-4 py-3 rounded-[var(--radius-card)] bg-surface-50 border border-surface-200 hover:border-brand-600/30 transition-all">
					<!-- Thumbnail -->
					<div class="w-12 h-12 rounded-lg bg-surface-100 overflow-hidden flex-shrink-0">
						{#if item.game.thumbnailUrl}
							<img
								src={item.game.thumbnailUrl}
								alt={item.game.name}
								class="w-full h-full object-cover"
								loading="lazy"
							/>
						{:else}
							<div class="w-full h-full flex items-center justify-center text-lg text-text-muted">🎲</div>
						{/if}
					</div>

					<!-- Info -->
					<div class="flex-1 min-w-0">
						<h3 class="font-semibold text-sm truncate">{item.game.name}</h3>
						<div class="flex flex-wrap gap-x-3 text-xs text-text-muted mt-0.5">
							{#if item.game.yearPublished}
								<span>{item.game.yearPublished}</span>
							{/if}
							{#if item.game.minPlayers && item.game.maxPlayers}
								<span>{item.game.minPlayers}-{item.game.maxPlayers} players</span>
							{/if}
							{#if item.game.playingTime}
								<span>{item.game.playingTime} min</span>
							{/if}
							{#if item.game.bggRating}
								<span>★ {item.game.bggRating.toFixed(1)}</span>
							{/if}
						</div>
					</div>

					<!-- Remove -->
					<button
						onclick={() => handleRemove(item.bggId, item.game.name)}
						disabled={removingBggId === item.bggId}
						class="px-3 py-1.5 rounded-md text-xs text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
					>
						Remove
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
