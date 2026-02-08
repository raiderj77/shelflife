<script lang="ts">
	import { db } from '$lib/db/dexie';
	import { onMount } from 'svelte';

	let totalGames = $state(0);
	let totalPlays = $state(0);
	let loading = $state(true);

	onMount(async () => {
		totalGames = await db.collection.count();
		totalPlays = await db.plays.count();
		loading = false;
	});
</script>

<div class="p-6 max-w-6xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Dashboard</h1>
		<p class="text-text-secondary">Welcome back! Here's your collection at a glance.</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
		<!-- Total Games -->
		<div class="card bg-surface-1 p-6">
			<div class="flex items-center justify-between mb-2">
				<span class="text-text-secondary text-sm">Total Games</span>
				<span class="text-2xl">🎮</span>
			</div>
			{#if loading}
				<div class="text-3xl font-bold text-text-secondary">--</div>
			{:else}
				<div class="text-3xl font-bold">{totalGames}</div>
			{/if}
		</div>

		<!-- Total Plays -->
		<div class="card bg-surface-1 p-6">
			<div class="flex items-center justify-between mb-2">
				<span class="text-text-secondary text-sm">Total Plays</span>
				<span class="text-2xl">📊</span>
			</div>
			{#if loading}
				<div class="text-3xl font-bold text-text-secondary">--</div>
			{:else}
				<div class="text-3xl font-bold">{totalPlays}</div>
			{/if}
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

			<!-- Log a Play (Coming Soon) -->
			<div class="card bg-surface-1 p-6 opacity-50 cursor-not-allowed">
				<div class="text-4xl mb-3">📝</div>
				<h3 class="font-semibold mb-1">Log a Play</h3>
				<p class="text-sm text-text-secondary">Coming soon</p>
			</div>
		</div>
	</div>

	<!-- Recent Activity (Placeholder) -->
	<div>
		<h2 class="text-xl font-semibold mb-4">Recent Activity</h2>
		<div class="card bg-surface-1 p-12 text-center">
			<div class="text-6xl mb-4">📊</div>
			<h3 class="text-lg font-semibold mb-2">No activity yet</h3>
			<p class="text-text-secondary">
				Start logging plays to see your gaming history here!
			</p>
		</div>
	</div>
</div>
