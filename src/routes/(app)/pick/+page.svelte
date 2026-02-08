<script lang="ts">
	import { db } from '$lib/db/schema';
	import type { LocalCollectionGame } from '$lib/db/schema';
	import { onMount } from 'svelte';

	// State
	let games = $state<any[]>([]);
	let playerCount = $state(4);
	let minTime = $state(0);
	let maxTime = $state(999);
	let pickedGame = $state<any | null>(null);
	let isRolling = $state(false);
	let showResult = $state(false);

	// Playtime presets
	const timeRanges = [
		{ label: 'Any length', min: 0, max: 999 },
		{ label: 'Quick (< 30 min)', min: 0, max: 30 },
		{ label: 'Short (30-60 min)', min: 30, max: 60 },
		{ label: 'Medium (60-120 min)', min: 60, max: 120 },
		{ label: 'Long (2+ hours)', min: 120, max: 999 }
	];

	let selectedTimeRange = $state(0);

	// Computed: filtered games
	let matchingGames = $derived.by(() => {
		return games.filter((item) => {
			const game = item.game;
			if (!game) return false;

			// Player count check
			const minPlayers = game.minPlayers || 1;
			const maxPlayers = game.maxPlayers || 99;
			const playerMatch = playerCount >= minPlayers && playerCount <= maxPlayers;

			// Playtime check
			const gameTime = game.playingTime || 0;
			const timeMatch = gameTime >= minTime && (maxTime === 999 || gameTime <= maxTime);

			return playerMatch && timeMatch;
		});
	});

	// Load games on mount
	onMount(async () => {
		const collectionItems = await db.collection.where('status').equals('owned').toArray();
		const results = [];
		for (const item of collectionItems) {
			const game = await db.games.where('bggId').equals(item.bggId).first();
			if (game) results.push({ ...item, game });
		}
		games = results;
		console.log('Pick page loaded games:', games.length);
	});

	// Handle time range change
	function handleTimeRangeChange(index: number) {
		selectedTimeRange = index;
		minTime = timeRanges[index].min;
		maxTime = timeRanges[index].max;
	}

	// Pick a random game
	async function pickRandomGame() {
		if (matchingGames.length === 0) return;

		// Reset state
		showResult = false;
		pickedGame = null;
		isRolling = true;

		// Animate for 1.5 seconds
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Pick random game
		const randomIndex = Math.floor(Math.random() * matchingGames.length);
		pickedGame = matchingGames[randomIndex];

		// Show result
		isRolling = false;
		showResult = true;
	}

	// Reset and pick again
	function pickAgain() {
		showResult = false;
		pickedGame = null;
	}
</script>

<div class="p-6 max-w-4xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">🎲 Pick a Game</h1>
		<p class="text-text-secondary">
			Set your filters and let the dice decide what to play tonight!
		</p>
	</div>

	<!-- Filter Controls -->
	<div class="card bg-surface-1 p-6 mb-6">
		<h2 class="text-lg font-semibold mb-4">Game Night Setup</h2>

		<!-- Player Count -->
<div class="mb-6">
	<label class="block text-sm font-medium mb-2">Number of Players</label>
	<div class="grid grid-cols-5 md:grid-cols-10 gap-2">
		{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as count}
			<button
				onclick={() => (playerCount = count)}
				class="btn btn-sm {playerCount === count
					? 'btn-accent'
					: 'btn-ghost border border-border'}"
			>
				{count}{count === 10 ? '+' : ''}
			</button>
		{/each}
	</div>
</div>

		<!-- Playtime -->
		<div class="mb-4">
			<label class="block text-sm font-medium mb-2">Playtime</label>
			<div class="grid grid-cols-2 md:grid-cols-5 gap-2">
				{#each timeRanges as range, index}
					<button
						onclick={() => handleTimeRangeChange(index)}
						class="btn btn-sm {selectedTimeRange === index
							? 'btn-accent'
							: 'btn-ghost border border-border'}"
					>
						{range.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Matching Games Count -->
		<div class="text-center mt-6 p-4 bg-surface-2 rounded-lg">
			<div class="text-4xl font-bold text-accent-primary mb-1">{matchingGames.length}</div>
			<div class="text-sm text-text-secondary">
				{matchingGames.length === 1 ? 'game matches' : 'games match'} your filters
			</div>
		</div>
	</div>

	<!-- Empty State -->
	{#if games.length === 0}
		<div class="card bg-surface-1 p-12 text-center">
			<div class="text-6xl mb-4">📦</div>
			<h3 class="text-xl font-semibold mb-2">No Games Yet</h3>
			<p class="text-text-secondary mb-4">Add some games to your collection first!</p>
			<a href="/import" class="btn btn-accent">Import Games</a>
		</div>
	{:else if matchingGames.length === 0}
		<div class="card bg-surface-1 p-12 text-center">
			<div class="text-6xl mb-4">🤷</div>
			<h3 class="text-xl font-semibold mb-2">No Matches</h3>
			<p class="text-text-secondary mb-4">Try adjusting your filters to find more games.</p>
			<button
				onclick={() => {
					playerCount = 4;
					handleTimeRangeChange(0);
				}}
				class="btn btn-ghost"
			>
				Reset Filters
			</button>
		</div>
	{:else if !showResult}
		<!-- Dice Button -->
		<div class="text-center">
			<button
				onclick={pickRandomGame}
				disabled={isRolling}
				class="btn btn-lg btn-accent relative overflow-hidden group disabled:opacity-50 {isRolling
					? 'animate-pulse'
					: ''}"
			>
				<span class="text-4xl mr-3 {isRolling ? 'animate-spin' : ''}">🎲</span>
				<span class="text-xl font-bold">
					{isRolling ? 'Rolling the dice...' : 'Shake the Dice!'}
				</span>
			</button>

			{#if isRolling}
				<div class="mt-4 text-text-secondary text-sm animate-pulse">
					Picking from {matchingGames.length} games...
				</div>
			{/if}
		</div>
	{/if}

	<!-- Result Card -->
	{#if showResult && pickedGame}
		<div class="animate-fade-in">
			<!-- "You should play..." header -->
			<div class="text-center mb-6">
				<p class="text-text-secondary mb-2">You should play...</p>
				<h2 class="text-4xl font-bold text-accent-primary">{pickedGame.game.name}</h2>
			</div>

			<!-- Game Card -->
			<div class="card bg-surface-1 overflow-hidden mb-6">
				<div class="md:flex">
					<!-- Image -->
					{#if pickedGame.game.thumbnail}
						<div class="md:w-1/3 bg-surface-2 flex items-center justify-center p-6">
							<img
								src={pickedGame.game.thumbnail}
								alt={pickedGame.game.name}
								class="max-w-full h-auto rounded-lg shadow-lg"
							/>
						</div>
					{/if}

					<!-- Details -->
					<div class="p-6 {pickedGame.game.thumbnail ? 'md:w-2/3' : 'w-full'}">
						<h3 class="text-2xl font-bold mb-4">{pickedGame.game.name}</h3>

						<div class="grid grid-cols-2 gap-4 mb-4">
							<div>
								<div class="text-xs text-text-secondary mb-1">Players</div>
								<div class="font-semibold">
									{#if pickedGame.game.minPlayers === pickedGame.game.maxPlayers}
										{pickedGame.game.minPlayers}
									{:else}
										{pickedGame.game.minPlayers || 1}–{pickedGame.game.maxPlayers || '?'}
									{/if}
								</div>
							</div>

							<div>
								<div class="text-xs text-text-secondary mb-1">Playtime</div>
								<div class="font-semibold">{pickedGame.game.playingTime || '?'} min</div>
							</div>

							{#if pickedGame.game.yearPublished}
								<div>
									<div class="text-xs text-text-secondary mb-1">Year</div>
									<div class="font-semibold">{pickedGame.game.yearPublished}</div>
								</div>
							{/if}

							{#if pickedGame.game.rating}
								<div>
									<div class="text-xs text-text-secondary mb-1">BGG Rating</div>
									<div class="font-semibold">⭐ {pickedGame.game.rating.toFixed(1)}</div>
								</div>
							{/if}
						</div>

						{#if pickedGame.game.description}
							<div class="text-sm text-text-secondary line-clamp-3">
								{pickedGame.game.description}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex gap-3 justify-center">
				<button onclick={pickAgain} class="btn btn-ghost">
					<span class="text-xl">🔄</span>
					Pick Again
				</button>
				<a href="/collection" class="btn btn-accent">
					<span class="text-xl">🎮</span>
					Let's Play!
				</a>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.5s ease-out;
	}

	.range {
		height: 0.5rem;
		background-color: rgb(var(--surface-2));
	}

	.range::-webkit-slider-thumb {
		background-color: rgb(var(--accent-primary));
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		cursor: pointer;
	}

	.range::-moz-range-thumb {
		background-color: rgb(var(--accent-primary));
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}
</style>
