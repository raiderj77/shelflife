<script lang="ts">
	import { db } from '$lib/db/schema';
	import { onMount } from 'svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';

	let totalGames = $state(0);
	let totalPlays = $state(0);
	let loading = $state(true);

	onMount(async () => {
		totalGames = await db.collection.count();
		totalPlays = await db.plays.count();
		loading = false;
	});

	let isEmpty = $derived(!loading && totalGames === 0 && totalPlays === 0);
</script>

<div class="p-6 max-w-6xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Dashboard</h1>
		<p class="text-text-secondary">Welcome back! Here's your collection at a glance.</p>
	</div>

	{#if loading}
		<!-- Skeleton loading -->
		<div class="mb-8">
			<Skeleton variant="stat" count={3} />
		</div>
		<div class="mb-8">
			<div class="h-6 bg-surface-200 rounded w-32 mb-4 animate-pulse"></div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{#each Array(4) as _}
					<div class="rounded-[var(--radius-card)] bg-surface-100 border border-surface-200 p-6 animate-pulse">
						<div class="w-10 h-10 bg-surface-200 rounded mb-3"></div>
						<div class="h-4 bg-surface-200 rounded w-2/3 mb-2"></div>
						<div class="h-3 bg-surface-200 rounded w-1/2"></div>
					</div>
				{/each}
			</div>
		</div>
	{:else if isEmpty}
		<!-- Empty state for new users -->
		<div class="card bg-surface-1 p-12 text-center mb-8">
			<div class="text-6xl mb-4">🎲</div>
			<h2 class="text-2xl font-bold mb-3">Your adventure starts here!</h2>
			<p class="text-text-secondary mb-8 max-w-md mx-auto">
				Add some games to your shelf and start tracking your game nights. It only takes a few seconds.
			</p>
			<div class="flex flex-col sm:flex-row items-center justify-center gap-3">
				<a
					href="/import"
					class="btn-accent px-6 py-3 rounded-xl font-semibold w-full sm:w-auto text-center"
				>
					📥 Import from BGG
				</a>
				<a
					href="/collection"
					class="px-6 py-3 rounded-xl font-semibold border border-surface-300 hover:border-brand-500/50 transition-colors w-full sm:w-auto text-center"
				>
					🎮 Add Games Manually
				</a>
			</div>
		</div>
	{:else}
		<!-- Stats Grid -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
			<!-- Total Games -->
			<div class="card bg-surface-1 p-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-text-secondary text-sm">Total Games</span>
					<span class="text-2xl">🎮</span>
				</div>
				<div class="text-3xl font-bold">{totalGames}</div>
			</div>

			<!-- Total Plays -->
			<div class="card bg-surface-1 p-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-text-secondary text-sm">Total Plays</span>
					<span class="text-2xl">📊</span>
				</div>
				<div class="text-3xl font-bold">{totalPlays}</div>
			</div>

			<!-- Collection Value (Coming Soon) -->
			<div class="card bg-surface-1 p-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-text-secondary text-sm">Collection Value</span>
					<span class="text-2xl">💰</span>
				</div>
				<div class="text-3xl font-bold text-text-secondary">--</div>
				<div class="text-xs text-text-secondary mt-1">Coming soon</div>
			</div>
		</div>
	{/if}

	<!-- Quick Actions -->
	<div class="mb-8">
		<h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<!-- Pick a Game - FEATURED -->
			<a
				href="/pick"
				class="card bg-gradient-to-br from-accent-primary to-accent-secondary p-6 text-white hover:scale-105 transition-transform"
			>
				<div class="text-4xl mb-3">🎲</div>
				<h3 class="font-semibold mb-1">Pick a Game</h3>
				<p class="text-sm text-white/80">Let the dice decide!</p>
			</a>

			<!-- My Games -->
			<a
				href="/collection"
				class="card bg-surface-1 p-6 hover:bg-surface-2 transition-colors"
			>
				<div class="text-4xl mb-3">🎮</div>
				<h3 class="font-semibold mb-1">My Games</h3>
				<p class="text-sm text-text-secondary">View your collection</p>
			</a>

			<!-- Import -->
			<a href="/import" class="card bg-surface-1 p-6 hover:bg-surface-2 transition-colors">
				<div class="text-4xl mb-3">📥</div>
				<h3 class="font-semibold mb-1">Import Games</h3>
				<p class="text-sm text-text-secondary">Add to your shelf</p>
			</a>

			<!-- Log a Play -->
			<a href="/plays" class="card bg-surface-1 p-6 hover:bg-surface-2 transition-colors">
				<div class="text-4xl mb-3">📝</div>
				<h3 class="font-semibold mb-1">Log a Play</h3>
				<p class="text-sm text-text-secondary">Track your sessions</p>
			</a>
		</div>
	</div>

	<!-- Recent Activity -->
	{#if !loading}
		<div>
			<h2 class="text-xl font-semibold mb-4">Recent Activity</h2>
			{#if totalPlays === 0}
				<div class="card bg-surface-1 p-12 text-center">
					<div class="text-5xl mb-4">📝</div>
					<h3 class="text-lg font-semibold mb-2">No plays logged yet</h3>
					<p class="text-text-secondary mb-4">
						Play some games and log them to see your activity here!
					</p>
					<a href="/plays" class="text-brand-400 hover:text-brand-300 font-medium text-sm transition-colors">
						Log your first play &rarr;
					</a>
				</div>
			{:else}
				<div class="card bg-surface-1 p-12 text-center">
					<div class="text-5xl mb-4">📊</div>
					<h3 class="text-lg font-semibold mb-2">{totalPlays} play{totalPlays !== 1 ? 's' : ''} logged</h3>
					<p class="text-text-secondary mb-4">
						Check your stats for detailed insights about your gaming habits.
					</p>
					<a href="/stats" class="text-brand-400 hover:text-brand-300 font-medium text-sm transition-colors">
						View Stats &rarr;
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>
