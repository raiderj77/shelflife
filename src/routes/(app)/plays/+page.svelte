<script lang="ts">
	import { db } from '$lib/db/schema';
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';

	// State
	let plays = $state<any[]>([]);
	let games = $state<any[]>([]);
	let loading = $state(true);
	let showLogForm = $state(false);

	// Form state
	let selectedGameBggId = $state<number | null>(null);
	let playedDate = $state(new Date().toISOString().split('T')[0]); // Today
	let durationMinutes = $state<number | null>(null);
	let winner = $state('');
	let notes = $state('');
	let isSubmitting = $state(false);

	// Load plays and games
	onMount(async () => {
		await loadPlays();
		await loadGames();
		loading = false;
	});

	async function loadPlays() {
		const allPlays = await db.plays.orderBy('playedAt').reverse().toArray();
		// Join with game data
		const results = [];
		for (const play of allPlays) {
			const game = await db.games.where('bggId').equals(play.bggId).first();
			if (game) results.push({ ...play, game });
		}
		plays = results;
	}

	async function loadGames() {
		const collectionItems = await db.collection.where('status').equals('owned').toArray();
		const results = [];
		for (const item of collectionItems) {
			const game = await db.games.where('bggId').equals(item.bggId).first();
			if (game) results.push(game);
		}
		games = results.sort((a, b) => a.name.localeCompare(b.name));
	}

	async function handleSubmit() {
		if (!selectedGameBggId) {
			toast.error('Please select a game');
			return;
		}

		isSubmitting = true;

		try {
			const game = games.find((g) => g.bggId === selectedGameBggId);

			await db.plays.add({
				bggId: selectedGameBggId,
				playedAt: new Date(playedDate),
				durationMinutes: durationMinutes || undefined,
				players: winner ? [{ name: winner, winner: true }] : [],
				notes: notes || undefined,
				syncStatus: 'pending'
			});

			// Reload plays
			await loadPlays();

			// Reset form
			selectedGameBggId = null;
			durationMinutes = null;
			winner = '';
			notes = '';
			showLogForm = false;

			toast.success(`Logged play of ${game?.name}!`);
		} catch (error) {
			console.error('Error logging play:', error);
			toast.error('Error logging play. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDeletePlay(playId: number) {
		if (!confirm('Delete this play log?')) return;

		try {
			const { deletePlay } = await import('$lib/db/schema');
			await deletePlay(playId);
			await loadPlays();
			toast.success('Play log deleted');
		} catch (err) {
			console.error('Error deleting play:', err);
			toast.error('Failed to delete play log');
		}
	}

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="p-6 max-w-4xl mx-auto">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold mb-2">📝 Play History</h1>
			<p class="text-text-secondary">Track your gaming sessions</p>
		</div>
		<button onclick={() => (showLogForm = !showLogForm)} class="btn btn-accent">
			{showLogForm ? '✕ Cancel' : '+ Log a Play'}
		</button>
	</div>

	<!-- Quick Log Form -->
	{#if showLogForm}
		<div class="card bg-surface-1 p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4">Log a Play</h2>

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<!-- Game Selection -->
				<div class="mb-4">
					<label class="block text-sm font-medium mb-2">Game *</label>
					<select
						bind:value={selectedGameBggId}
						required
						class="select select-bordered w-full bg-surface-2"
					>
						<option value={null}>Select a game...</option>
						{#each games as game}
							<option value={game.bggId}>{game.name}</option>
						{/each}
					</select>
				</div>

				<!-- Date -->
				<div class="mb-4">
					<label class="block text-sm font-medium mb-2">Date Played *</label>
					<input
						type="date"
						bind:value={playedDate}
						required
						class="input input-bordered w-full bg-surface-2"
					/>
				</div>

				<!-- Duration (Optional) -->
				<div class="mb-4">
					<label class="block text-sm font-medium mb-2">Duration (minutes)</label>
					<input
						type="number"
						bind:value={durationMinutes}
						placeholder="e.g., 45"
						min="1"
						class="input input-bordered w-full bg-surface-2"
					/>
				</div>

				<!-- Winner (Optional) -->
				<div class="mb-4">
					<label class="block text-sm font-medium mb-2">Winner</label>
					<input
						type="text"
						bind:value={winner}
						placeholder="e.g., Alice"
						class="input input-bordered w-full bg-surface-2"
					/>
				</div>

				<!-- Notes (Optional) -->
				<div class="mb-4">
					<label class="block text-sm font-medium mb-2">Notes</label>
					<textarea
						bind:value={notes}
						placeholder="How did it go? Any memorable moments?"
						rows="3"
						class="textarea textarea-bordered w-full bg-surface-2"
					></textarea>
				</div>

				<!-- Submit -->
				<div class="flex gap-3">
					<button type="submit" disabled={isSubmitting} class="btn btn-accent flex-1">
						{isSubmitting ? 'Logging...' : '✅ Log Play'}
					</button>
					<button
						type="button"
						onclick={() => (showLogForm = false)}
						class="btn btn-ghost"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Loading State -->
	{#if loading}
		<div class="text-center py-12">
			<div class="text-4xl mb-4 animate-bounce">🎲</div>
			<p class="text-text-secondary">Loading play history...</p>
		</div>
	{:else if plays.length === 0}
		<!-- Empty State -->
		<div class="card bg-surface-1 p-12 text-center">
			<div class="text-6xl mb-4">📊</div>
			<h3 class="text-xl font-semibold mb-2">No Plays Logged Yet</h3>
			<p class="text-text-secondary mb-4">
				Start logging your gaming sessions to track your play history!
			</p>
			<button onclick={() => (showLogForm = true)} class="btn btn-accent">
				Log Your First Play
			</button>
		</div>
	{:else}
		<!-- Play History List -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">{plays.length} Plays Logged</h2>

			{#each plays as play}
				<div class="card bg-surface-1 p-4 hover:bg-surface-2 transition-colors">
					<div class="flex items-start justify-between">
						<!-- Game Info -->
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								{#if play.game.thumbnailUrl}
									<img
										src={play.game.thumbnailUrl}
										alt={play.game.name}
										class="w-12 h-12 rounded object-cover"
									/>
								{/if}
								<div>
									<h3 class="font-semibold text-lg">{play.game.name}</h3>
									<p class="text-sm text-text-secondary">
										{formatDate(play.playedAt)}
									</p>
								</div>
							</div>

							<!-- Play Details -->
							<div class="flex flex-wrap gap-4 text-sm">
								{#if play.durationMinutes}
									<div class="text-text-secondary">
										⏱️ {play.durationMinutes} min
									</div>
								{/if}
								{#if play.players && play.players.length > 0}
									<div class="text-text-secondary">
										🏆 Winner: {play.players.find((p) => p.winner)?.name || 'N/A'}
									</div>
								{/if}
							</div>

							{#if play.notes}
								<p class="text-sm text-text-secondary mt-2 italic">"{play.notes}"</p>
							{/if}
						</div>

						<!-- Delete Button -->
						<button
							onclick={() => handleDeletePlay(play.id)}
							class="btn btn-sm btn-ghost text-error hover:bg-error/10"
							title="Delete play log"
						>
							🗑️
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
