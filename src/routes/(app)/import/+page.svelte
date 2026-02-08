<script lang="ts">
	import { importCollection, searchGames, getGameDetails, type ImportProgress, type SearchResult } from '$lib/services/bgg';
	import { db, addToCollection, type LocalGame } from '$lib/db/schema';
	import { liveQuery } from 'dexie';
	import { onMount } from 'svelte';

	// Popular games for quick-add
	const popularGames = [
		{ name: 'Catan', year: 1995, minP: 3, maxP: 4, time: 90, players: '3-4' },
		{ name: 'Ticket to Ride', year: 2004, minP: 2, maxP: 5, time: 60, players: '2-5' },
		{ name: 'Azul', year: 2017, minP: 2, maxP: 4, time: 45, players: '2-4' },
		{ name: 'Wingspan', year: 2019, minP: 1, maxP: 5, time: 70, players: '1-5' },
		{ name: 'Codenames', year: 2015, minP: 2, maxP: 8, time: 15, players: '2-8+' },
		{ name: 'Pandemic', year: 2008, minP: 2, maxP: 4, time: 45, players: '2-4' },
		{ name: '7 Wonders', year: 2010, minP: 2, maxP: 7, time: 30, players: '2-7' },
		{ name: 'Dominion', year: 2008, minP: 2, maxP: 4, time: 30, players: '2-4' },
		{ name: 'Carcassonne', year: 2000, minP: 2, maxP: 5, time: 45, players: '2-5' },
		{ name: 'Splendor', year: 2014, minP: 2, maxP: 4, time: 30, players: '2-4' },
		{ name: 'King of Tokyo', year: 2011, minP: 2, maxP: 6, time: 30, players: '2-6' },
		{ name: 'Terraforming Mars', year: 2016, minP: 1, maxP: 5, time: 120, players: '1-5' },
		{ name: 'Scythe', year: 2016, minP: 1, maxP: 5, time: 115, players: '1-5' },
		{ name: 'Gloomhaven', year: 2017, minP: 1, maxP: 4, time: 120, players: '1-4' },
		{ name: 'Root', year: 2018, minP: 2, maxP: 4, time: 90, players: '2-4' },
		{ name: 'Betrayal at House on the Hill', year: 2004, minP: 3, maxP: 6, time: 60, players: '3-6' },
		{ name: 'Clank!', year: 2016, minP: 2, maxP: 4, time: 60, players: '2-4' },
		{ name: 'Everdell', year: 2018, minP: 1, maxP: 4, time: 80, players: '1-4' },
		{ name: 'Spirit Island', year: 2017, minP: 1, maxP: 4, time: 120, players: '1-4' },
		{ name: 'Brass: Birmingham', year: 2018, minP: 2, maxP: 4, time: 120, players: '2-4' },
		{ name: 'Ark Nova', year: 2021, minP: 1, maxP: 4, time: 150, players: '1-4' },
		{ name: 'Cascadia', year: 2021, minP: 1, maxP: 4, time: 45, players: '1-4' },
		{ name: 'Quacks of Quedlinburg', year: 2018, minP: 2, maxP: 4, time: 45, players: '2-4' },
		{ name: 'Mysterium', year: 2015, minP: 2, maxP: 7, time: 42, players: '2-7' },
	];

	// ============================================
	// State
	// ============================================
	let activeTab = $state<'manual' | 'bgg'>('manual');
	let bggAvailable = $state<boolean | null>(null);

	// Manual entry
	let manualName = $state('');
	let manualYear = $state('');
	let manualMinPlayers = $state('');
	let manualMaxPlayers = $state('');
	let manualPlaytime = $state('');
	let manualAdding = $state(false);
	let manualSuccess = $state('');
	let manualError = $state('');

	// BGG import
	let bggUsername = $state('');
	let importProgress = $state<ImportProgress | null>(null);
	let importError = $state('');

	// BGG search
	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let searchLoading = $state(false);
	let searchError = $state('');
	let addingGameId = $state<number | null>(null);

	// Collection tracking
	let collectionBggIds = $state<Set<number>>(new Set());
	let collectionNames = $state<Set<string>>(new Set());
	let gameCount = $state(0);

	onMount(() => {
		checkBggStatus();

		const sub1 = liveQuery(async () => {
			const items = await db.collection.toArray();
			const names = new Set<string>();
			for (const item of items) {
				const game = await db.games.where('bggId').equals(item.bggId).first();
				if (game) names.add(game.name.toLowerCase());
			}
			return { ids: new Set(items.map(i => i.bggId)), names };
		}).subscribe((data) => {
			collectionBggIds = data.ids;
			collectionNames = data.names;
		});
		const sub2 = liveQuery(() => db.collection.count()).subscribe((count) => {
			gameCount = count;
		});
		return () => { sub1.unsubscribe(); sub2.unsubscribe(); };
	});

	async function checkBggStatus() {
		try {
			const res = await fetch('/api/bgg?type=search&query=test');
			bggAvailable = res.ok;
		} catch {
			bggAvailable = false;
		}
	}

	// ============================================
	// Helpers
	// ============================================
	async function getNextLocalId(): Promise<number> {
		const existingGames = await db.games.toArray();
		const localIds = existingGames.map(g => g.bggId).filter(id => id < 0);
		return localIds.length > 0 ? Math.min(...localIds) - 1 : -1;
	}

	// ============================================
	// Manual Game Entry
	// ============================================
	async function handleManualAdd() {
		if (!manualName.trim()) {
			manualError = 'Please enter a game name';
			return;
		}

		manualAdding = true;
		manualError = '';
		manualSuccess = '';

		try {
			const nextLocalId = await getNextLocalId();

			const game: Omit<LocalGame, 'id'> = {
				bggId: nextLocalId,
				name: manualName.trim(),
				yearPublished: manualYear ? parseInt(manualYear) : undefined,
				minPlayers: manualMinPlayers ? parseInt(manualMinPlayers) : undefined,
				maxPlayers: manualMaxPlayers ? parseInt(manualMaxPlayers) : undefined,
				playingTime: manualPlaytime ? parseInt(manualPlaytime) : undefined,
				categories: [],
				mechanics: []
			};

			await addToCollection(game, 'owned');
			manualSuccess = `Added "${manualName.trim()}" to your collection!`;

			manualName = '';
			manualYear = '';
			manualMinPlayers = '';
			manualMaxPlayers = '';
			manualPlaytime = '';

			setTimeout(() => { manualSuccess = ''; }, 3000);
		} catch (e: any) {
			manualError = e.message || 'Failed to add game';
		} finally {
			manualAdding = false;
		}
	}

	async function quickAddGame(game: typeof popularGames[0]) {
		if (collectionNames.has(game.name.toLowerCase())) return; // Already added

		const nextLocalId = await getNextLocalId();

		const newGame: Omit<LocalGame, 'id'> = {
			bggId: nextLocalId,
			name: game.name,
			yearPublished: game.year,
			minPlayers: game.minP,
			maxPlayers: game.maxP,
			playingTime: game.time,
			categories: [],
			mechanics: []
		};

		await addToCollection(newGame, 'owned');
	}

	// ============================================
	// BGG Import
	// ============================================
	async function handleImport() {
		if (!bggUsername.trim()) {
			importError = 'Please enter your BGG username';
			return;
		}

		importError = '';
		importProgress = null;

		try {
			const games = await importCollection(bggUsername.trim(), (progress) => {
				importProgress = { ...progress };
			});

			let added = 0;
			for (const game of games) {
				try {
					await addToCollection(game, 'owned');
					added++;
				} catch (e) {
					console.warn('Failed to add:', game.name, e);
				}
			}

			importProgress = {
				status: 'done',
				message: `Added ${added} games to your collection!`,
				total: games.length,
				imported: added
			};
		} catch (e: any) {
			importError = e.message || 'Import failed.';
			importProgress = null;
		}
	}

	// ============================================
	// BGG Search
	// ============================================
	let searchTimeout: ReturnType<typeof setTimeout>;

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchError = '';
		if (!searchQuery.trim()) { searchResults = []; return; }

		searchTimeout = setTimeout(async () => {
			searchLoading = true;
			try {
				searchResults = await searchGames(searchQuery.trim());
			} catch (e: any) {
				searchError = e.message || 'Search failed';
				searchResults = [];
			} finally {
				searchLoading = false;
			}
		}, 400);
	}

	async function handleAddGame(result: SearchResult) {
		addingGameId = result.bggId;
		try {
			const game = await getGameDetails(result.bggId);
			if (!game) throw new Error('Could not fetch game details');
			await addToCollection(game, 'owned');
		} catch (e: any) {
			searchError = `Failed to add ${result.name}: ${e.message}`;
		} finally {
			addingGameId = null;
		}
	}
</script>

<svelte:head>
	<title>Add Games — ShelfLife</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div>
		<h1 class="text-2xl md:text-3xl font-bold flex items-center gap-3">
			<span>📥</span> Add Games
		</h1>
		<p class="text-text-secondary mt-1">
			Add games to your shelf manually or import from BoardGameGeek.
			{#if gameCount > 0}
				<span class="text-brand-400 font-medium">({gameCount} game{gameCount !== 1 ? 's' : ''} on your shelf)</span>
			{/if}
		</p>
	</div>

	<!-- Tab Switcher -->
	<div class="flex gap-1 p-1 rounded-lg bg-surface-100 border border-surface-200 w-fit">
		<button
			onclick={() => activeTab = 'manual'}
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'manual' ? 'bg-brand-600 text-white' : 'text-text-secondary hover:text-text-primary'}"
		>
			Add Manually
		</button>
		<button
			onclick={() => activeTab = 'bgg'}
			class="px-4 py-2 rounded-md text-sm font-medium transition-colors {activeTab === 'bgg' ? 'bg-brand-600 text-white' : 'text-text-secondary hover:text-text-primary'}"
		>
			BoardGameGeek
		</button>
	</div>

	<!-- ============================================ -->
	<!-- MANUAL TAB -->
	<!-- ============================================ -->
	{#if activeTab === 'manual'}
		<div class="p-6 rounded-[var(--radius-card)] bg-surface-50 border border-surface-200">
			<h2 class="text-lg font-semibold mb-1">Add a Game</h2>
			<p class="text-text-secondary text-sm mb-5">
				Enter the details for a board game you own. Only the name is required.
			</p>

			<div class="space-y-4 max-w-lg">
				<div>
					<label for="game-name" class="block text-sm font-medium text-text-secondary mb-1.5">
						Game Name <span class="text-red-400">*</span>
					</label>
					<input
						id="game-name"
						type="text"
						bind:value={manualName}
						placeholder="e.g., Catan, Ticket to Ride, Azul..."
						onkeydown={(e) => { if (e.key === 'Enter') handleManualAdd(); }}
						class="w-full px-4 py-3 rounded-[var(--radius-button)] bg-surface-100 border border-surface-300 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
					/>
				</div>

				<div class="grid grid-cols-3 gap-3">
					<div>
						<label for="game-year" class="block text-sm font-medium text-text-secondary mb-1.5">Year</label>
						<input id="game-year" type="number" bind:value={manualYear} placeholder="2024" min="1900" max="2030"
							class="w-full px-3 py-3 rounded-[var(--radius-button)] bg-surface-100 border border-surface-300 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
					</div>
					<div>
						<label for="min-players" class="block text-sm font-medium text-text-secondary mb-1.5">Min Players</label>
						<input id="min-players" type="number" bind:value={manualMinPlayers} placeholder="1" min="1" max="99"
							class="w-full px-3 py-3 rounded-[var(--radius-button)] bg-surface-100 border border-surface-300 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
					</div>
					<div>
						<label for="max-players" class="block text-sm font-medium text-text-secondary mb-1.5">Max Players</label>
						<input id="max-players" type="number" bind:value={manualMaxPlayers} placeholder="4" min="1" max="99"
							class="w-full px-3 py-3 rounded-[var(--radius-button)] bg-surface-100 border border-surface-300 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
					</div>
				</div>

				<div class="max-w-[200px]">
					<label for="playtime" class="block text-sm font-medium text-text-secondary mb-1.5">Playtime (min)</label>
					<input id="playtime" type="number" bind:value={manualPlaytime} placeholder="60" min="1" max="999"
						class="w-full px-3 py-3 rounded-[var(--radius-button)] bg-surface-100 border border-surface-300 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
				</div>

				<button
					onclick={handleManualAdd}
					disabled={manualAdding || !manualName.trim()}
					class="px-6 py-3 rounded-[var(--radius-button)] bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{manualAdding ? 'Adding...' : 'Add to Collection'}
				</button>

				{#if manualSuccess}
					<div class="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
						<span>✓</span> {manualSuccess}
					</div>
				{/if}

				{#if manualError}
					<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{manualError}</div>
				{/if}
			</div>
		</div>

		<!-- Quick Add Popular Games -->
		<div class="p-6 rounded-[var(--radius-card)] bg-surface-50 border border-surface-200">
			<h2 class="text-lg font-semibold mb-1">Quick Add Popular Games</h2>
			<p class="text-text-secondary text-sm mb-5">Tap to instantly add popular games to your shelf.</p>
			<div class="flex flex-wrap gap-2">
				{#each popularGames as game}
					{@const alreadyAdded = collectionNames.has(game.name.toLowerCase())}
					<button
						onclick={() => quickAddGame(game)}
						disabled={alreadyAdded}
						class="px-3 py-2 rounded-lg text-sm transition-all {alreadyAdded
							? 'bg-green-500/10 border border-green-500/20 text-green-400 cursor-default'
							: 'bg-surface-100 border border-surface-200 hover:border-brand-600/30 hover:bg-surface-200 text-text-primary'}"
					>
						{#if alreadyAdded}✓{/if}
						{game.name}
						{#if game.players}
							<span class="text-text-muted ml-1">({game.players})</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ============================================ -->
	<!-- BGG TAB -->
	<!-- ============================================ -->
	{#if activeTab === 'bgg'}
		{#if bggAvailable === false}
			<div class="p-6 rounded-[var(--radius-card)] bg-surface-50 border border-surface-200">
				<div class="flex items-start gap-4">
					<div class="text-3xl">🔑</div>
					<div>
						<h2 class="text-lg font-semibold mb-2">BGG API Token Required</h2>
						<p class="text-text-secondary text-sm mb-4">
							BoardGameGeek now requires registered apps with API tokens. Here's how to get one:
						</p>
						<ol class="text-text-secondary text-sm space-y-2 list-decimal list-inside mb-4">
							<li>Create a free account at <a href="https://boardgamegeek.com/register" target="_blank" class="text-brand-400 hover:text-brand-300">boardgamegeek.com</a></li>
							<li>Register your app at <a href="https://boardgamegeek.com/applications" target="_blank" class="text-brand-400 hover:text-brand-300">boardgamegeek.com/applications</a></li>
							<li>Wait for approval (may take a week or more)</li>
							<li>Create a token and add it to your <code class="px-1.5 py-0.5 rounded bg-surface-200 text-xs">.env</code> file as <code class="px-1.5 py-0.5 rounded bg-surface-200 text-xs">BGG_API_TOKEN=your-token</code></li>
						</ol>
						<p class="text-text-secondary text-sm">
							In the meantime, use the
							<button onclick={() => activeTab = 'manual'} class="text-brand-400 hover:text-brand-300 font-medium">Add Manually</button>
							tab to build your collection!
						</p>
					</div>
				</div>
			</div>
		{:else}
			<!-- BGG Import -->
			<div class="p-6 rounded-[var(--radius-card)] bg-surface-50 border border-surface-200">
				<h2 class="text-lg font-semibold mb-1">Import from BoardGameGeek</h2>
				<p class="text-text-secondary text-sm mb-5">Enter your BGG username to pull your entire collection.</p>

				<div class="flex gap-3">
					<input type="text" bind:value={bggUsername} placeholder="Your BGG username"
						disabled={importProgress !== null && importProgress.status !== 'done' && importProgress.status !== 'error'}
						onkeydown={(e) => { if (e.key === 'Enter') handleImport(); }}
						class="flex-1 px-4 py-3 rounded-[var(--radius-button)] bg-surface-100 border border-surface-300 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50" />
					<button onclick={handleImport}
						disabled={importProgress !== null && importProgress.status !== 'done' && importProgress.status !== 'error'}
						class="px-6 py-3 rounded-[var(--radius-button)] bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
						{importProgress && importProgress.status !== 'done' && importProgress.status !== 'error' ? 'Importing...' : 'Import'}
					</button>
				</div>

				{#if importProgress}
					<div class="mt-4">
						{#if importProgress.total > 0}
							<div class="w-full h-2 rounded-full bg-surface-200 overflow-hidden mb-2">
								<div class="h-full rounded-full transition-all duration-300 {importProgress.status === 'done' ? 'bg-green-500' : 'bg-brand-500'}"
									style="width: {Math.round((importProgress.imported / importProgress.total) * 100)}%"></div>
							</div>
						{/if}
						<div class="flex items-center gap-2 text-sm">
							{#if importProgress.status === 'done'}<span class="text-green-500">✓</span>
							{:else}<div class="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin"></div>{/if}
							<span class="text-text-secondary">{importProgress.message}</span>
						</div>
					</div>
				{/if}

				{#if importError}<div class="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{importError}</div>{/if}
			</div>

			<!-- BGG Search -->
			<div class="p-6 rounded-[var(--radius-card)] bg-surface-50 border border-surface-200">
				<h2 class="text-lg font-semibold mb-1">Search BGG</h2>
				<p class="text-text-secondary text-sm mb-5">Search BoardGameGeek to add games with full details.</p>

				<div class="relative">
					<input type="text" bind:value={searchQuery} oninput={handleSearchInput} placeholder="Search for a board game..."
						class="w-full px-4 py-3 pl-10 rounded-[var(--radius-button)] bg-surface-100 border border-surface-300 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
					<svg class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
					{#if searchLoading}<div class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin"></div>{/if}
				</div>

				{#if searchResults.length > 0}
					<div class="mt-4 space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
						{#each searchResults as result}
							{@const inCollection = collectionBggIds.has(result.bggId)}
							<div class="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-surface-100 border border-surface-200">
								<div class="min-w-0">
									<p class="font-medium text-sm truncate">{result.name}</p>
									{#if result.yearPublished}<p class="text-text-muted text-xs">{result.yearPublished}</p>{/if}
								</div>
								{#if inCollection}
									<span class="text-green-500 text-xs font-medium whitespace-nowrap">✓ Added</span>
								{:else}
									<button onclick={() => handleAddGame(result)} disabled={addingGameId === result.bggId}
										class="px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
										{addingGameId === result.bggId ? 'Adding...' : '+ Add'}
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{:else if searchQuery.trim() && !searchLoading}
					<p class="mt-4 text-text-muted text-sm text-center py-4">No games found for "{searchQuery}"</p>
				{/if}

				{#if searchError}<div class="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{searchError}</div>{/if}
			</div>
		{/if}
	{/if}
</div>
