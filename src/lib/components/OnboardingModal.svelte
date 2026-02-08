<script lang="ts">
	import { goto } from '$app/navigation';
	import { db } from '$lib/db/schema';
	import { toast } from '$lib/stores/toast.svelte';

	let { onComplete }: { onComplete: () => void } = $props();

	let step = $state(0);
	let addedGames = $state<Set<string>>(new Set());
	let adding = $state<string | null>(null);

	const popularGames = [
		{ name: 'Catan', bggId: 13, year: 1995, minPlayers: 3, maxPlayers: 4, playingTime: 120, icon: '🏝️' },
		{ name: 'Ticket to Ride', bggId: 9209, year: 2004, minPlayers: 2, maxPlayers: 5, playingTime: 60, icon: '🚂' },
		{ name: 'Codenames', bggId: 178900, year: 2015, minPlayers: 2, maxPlayers: 8, playingTime: 15, icon: '🕵️' },
		{ name: 'Wingspan', bggId: 266192, year: 2019, minPlayers: 1, maxPlayers: 5, playingTime: 70, icon: '🦅' },
		{ name: 'Azul', bggId: 230802, year: 2017, minPlayers: 2, maxPlayers: 4, playingTime: 45, icon: '🎨' },
		{ name: 'Pandemic', bggId: 30549, year: 2008, minPlayers: 2, maxPlayers: 4, playingTime: 45, icon: '🦠' }
	];

	async function addGame(game: (typeof popularGames)[0]) {
		if (addedGames.has(game.name) || adding) return;
		adding = game.name;

		try {
			const existing = await db.games.where('bggId').equals(game.bggId).first();
			if (!existing) {
				await db.games.add({
					bggId: game.bggId,
					name: game.name,
					yearPublished: game.year,
					minPlayers: game.minPlayers,
					maxPlayers: game.maxPlayers,
					playingTime: game.playingTime,
					categories: [],
					mechanics: []
				});
			}

			const inCollection = await db.collection.where('bggId').equals(game.bggId).first();
			if (!inCollection) {
				await db.collection.add({
					bggId: game.bggId,
					status: 'owned',
					addedAt: new Date(),
					updatedAt: new Date(),
					syncStatus: 'pending'
				});
			}

			addedGames = new Set([...addedGames, game.name]);
		} catch (err) {
			console.error('Error adding game:', err);
		} finally {
			adding = null;
		}
	}

	function finish() {
		if (addedGames.size > 0) {
			toast.success(`Added ${addedGames.size} game${addedGames.size > 1 ? 's' : ''} to your shelf!`);
		}
		onComplete();
	}

	function skip() {
		onComplete();
	}

	function goToCollection() {
		finish();
		goto('/collection');
	}

	function goToPicker() {
		finish();
		goto('/pick');
	}
</script>

<!-- Backdrop -->
<div class="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
	<!-- Modal -->
	<div class="bg-surface-100 border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
		<!-- Step indicator -->
		<div class="flex justify-center gap-2 pt-6">
			{#each [0, 1, 2] as i}
				<div
					class="h-1.5 rounded-full transition-all duration-300 {i === step
						? 'w-8 bg-brand-500'
						: i < step
							? 'w-4 bg-brand-500/50'
							: 'w-4 bg-surface-300'}"
				></div>
			{/each}
		</div>

		<div class="p-8">
			{#if step === 0}
				<!-- Step 1: Welcome -->
				<div class="text-center">
					<div class="text-6xl mb-4">🎲</div>
					<h2 class="text-2xl font-bold mb-3">Welcome to ShelfLife!</h2>
					<p class="text-text-secondary mb-2">
						Your board game collection, finally organized.
					</p>
					<p class="text-text-muted text-sm">
						Add games to your shelf, pick what to play on game night, and track every session — all offline.
					</p>
				</div>

				<div class="mt-8 flex flex-col gap-3">
					<button onclick={() => (step = 1)} class="btn-accent w-full py-3 rounded-xl font-semibold">
						Let's Get Started
					</button>
					<button onclick={skip} class="text-sm text-text-muted hover:text-text-secondary transition-colors">
						Skip for now
					</button>
				</div>

			{:else if step === 1}
				<!-- Step 2: Add games -->
				<div class="text-center mb-6">
					<h2 class="text-2xl font-bold mb-2">Add your first games</h2>
					<p class="text-text-secondary text-sm">
						Tap to add popular games, or skip to add your own later.
					</p>
				</div>

				<div class="grid grid-cols-2 gap-3">
					{#each popularGames as game}
						<button
							onclick={() => addGame(game)}
							disabled={addedGames.has(game.name) || adding === game.name}
							class="flex items-center gap-3 p-3 rounded-xl border transition-all text-left
								{addedGames.has(game.name)
								? 'bg-green-500/10 border-green-500/30'
								: 'bg-surface-200/50 border-surface-300 hover:border-brand-500/50 hover:bg-surface-200'}"
						>
							<span class="text-2xl">{addedGames.has(game.name) ? '✅' : game.icon}</span>
							<div class="min-w-0">
								<div class="font-medium text-sm truncate">{game.name}</div>
								<div class="text-xs text-text-muted">{game.minPlayers}-{game.maxPlayers}p &bull; {game.playingTime}m</div>
							</div>
						</button>
					{/each}
				</div>

				<div class="mt-6 flex flex-col gap-3">
					<button onclick={() => (step = 2)} class="btn-accent w-full py-3 rounded-xl font-semibold">
						{addedGames.size > 0 ? 'Continue' : 'Skip This Step'}
					</button>
				</div>

			{:else}
				<!-- Step 3: All set -->
				<div class="text-center">
					<div class="text-6xl mb-4">🎉</div>
					<h2 class="text-2xl font-bold mb-3">You're all set!</h2>
					<p class="text-text-secondary mb-6">
						{#if addedGames.size > 0}
							{addedGames.size} game{addedGames.size > 1 ? 's' : ''} added to your shelf. Here's what you can do next:
						{:else}
							Here's what you can do next:
						{/if}
					</p>

					<div class="space-y-3 mb-8">
						<button
							onclick={goToCollection}
							class="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-200/50 border border-surface-300 hover:border-brand-500/50 transition-colors text-left"
						>
							<span class="text-3xl">🎮</span>
							<div>
								<div class="font-semibold">View My Collection</div>
								<div class="text-sm text-text-secondary">Browse, search, and filter your games</div>
							</div>
						</button>

						<button
							onclick={goToPicker}
							class="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-200/50 border border-surface-300 hover:border-brand-500/50 transition-colors text-left"
						>
							<span class="text-3xl">🎲</span>
							<div>
								<div class="font-semibold">Pick a Game</div>
								<div class="text-sm text-text-secondary">Let the dice decide what to play tonight</div>
							</div>
						</button>
					</div>

					<button onclick={finish} class="text-sm text-text-muted hover:text-text-secondary transition-colors">
						Go to Dashboard
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
