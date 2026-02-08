<script lang="ts">
	import { db } from '$lib/db/schema';
	import { onMount } from 'svelte';

	// State
	let loading = $state(true);
	let totalGames = $state(0);
	let totalPlays = $state(0);
	let totalHours = $state(0);
	let mostPlayedGames = $state<any[]>([]);
	let recentPlays = $state<any[]>([]);
	let playsByMonth = $state<any[]>([]);

	onMount(async () => {
		await loadStats();
		loading = false;
	});

	async function loadStats() {
		// Total games
		totalGames = await db.collection.where('status').equals('owned').count();

		// Load all plays with game data
		const allPlays = await db.plays.toArray();
		totalPlays = allPlays.length;

		// Calculate total hours
		totalHours = allPlays.reduce((sum, play) => sum + (play.durationMinutes || 0), 0) / 60;

		// Most played games
		const playCountByGame = new Map<number, { count: number; totalMinutes: number }>();
		
		for (const play of allPlays) {
			const existing = playCountByGame.get(play.bggId) || { count: 0, totalMinutes: 0 };
			playCountByGame.set(play.bggId, {
				count: existing.count + 1,
				totalMinutes: existing.totalMinutes + (play.durationMinutes || 0)
			});
		}

		// Get game details for top played
		const topGames = Array.from(playCountByGame.entries())
			.sort((a, b) => b[1].count - a[1].count)
			.slice(0, 10);

		const mostPlayedWithDetails = [];
		for (const [bggId, stats] of topGames) {
			const game = await db.games.where('bggId').equals(bggId).first();
			if (game) {
				mostPlayedWithDetails.push({
					game,
					playCount: stats.count,
					totalMinutes: stats.totalMinutes,
					avgMinutes: Math.round(stats.totalMinutes / stats.count)
				});
			}
		}
		mostPlayedGames = mostPlayedWithDetails;

		// Recent plays
		const recent = await db.plays.orderBy('playedAt').reverse().limit(10).toArray();
		const recentWithGames = [];
		for (const play of recent) {
			const game = await db.games.where('bggId').equals(play.bggId).first();
			if (game) recentWithGames.push({ ...play, game });
		}
		recentPlays = recentWithGames;

		// Plays by month (last 6 months)
		const now = new Date();
		const monthsData = [];
		for (let i = 5; i >= 0; i--) {
			const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
			const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
			
			const playsInMonth = allPlays.filter(play => {
				const playDate = new Date(play.playedAt);
				return playDate >= monthStart && playDate <= monthEnd;
			});

			monthsData.push({
				month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
				count: playsInMonth.length
			});
		}
		playsByMonth = monthsData;
	}

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	function formatDuration(minutes: number) {
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
</script>

<div class="p-6 max-w-6xl mx-auto">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">📊 Stats & Insights</h1>
		<p class="text-text-secondary">Your gaming patterns and favorites</p>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<div class="text-4xl mb-4 animate-bounce">🎲</div>
			<p class="text-text-secondary">Crunching the numbers...</p>
		</div>
	{:else if totalPlays === 0}
		<!-- Empty State -->
		<div class="card bg-surface-1 p-12 text-center">
			<div class="text-6xl mb-4">📊</div>
			<h3 class="text-xl font-semibold mb-2">No Play Data Yet</h3>
			<p class="text-text-secondary mb-4">
				Start logging plays to see your gaming stats and insights!
			</p>
			<a href="/plays" class="btn btn-accent">Log Your First Play</a>
		</div>
	{:else}
		<!-- Summary Stats -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
			<!-- Total Games -->
			<div class="card bg-surface-1 p-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-text-secondary text-sm">Games Owned</span>
					<span class="text-2xl">🎮</span>
				</div>
				<div class="text-3xl font-bold">{totalGames}</div>
			</div>

			<!-- Total Plays -->
			<div class="card bg-surface-1 p-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-text-secondary text-sm">Games Played</span>
					<span class="text-2xl">🎲</span>
				</div>
				<div class="text-3xl font-bold text-brand-500">{totalPlays}</div>
			</div>

			<!-- Total Hours -->
			<div class="card bg-surface-1 p-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-text-secondary text-sm">Hours Played</span>
					<span class="text-2xl">⏱️</span>
				</div>
				<div class="text-3xl font-bold text-accent-500">{totalHours.toFixed(1)}</div>
			</div>

			<!-- Avg Session -->
			<div class="card bg-surface-1 p-6">
				<div class="flex items-center justify-between mb-2">
					<span class="text-text-secondary text-sm">Avg Session</span>
					<span class="text-2xl">📏</span>
				</div>
				<div class="text-3xl font-bold">
					{totalPlays > 0 ? formatDuration(Math.round((totalHours * 60) / totalPlays)) : '--'}
				</div>
			</div>
		</div>

		<!-- Play Frequency Chart -->
		<div class="card bg-surface-1 p-6 mb-8">
			<h2 class="text-xl font-semibold mb-4">Play Frequency (Last 6 Months)</h2>
			<div class="flex items-end justify-between gap-2 h-40">
				{#each playsByMonth as month}
					{@const maxCount = Math.max(...playsByMonth.map(m => m.count))}
					{@const heightPercent = maxCount > 0 ? (month.count / maxCount) * 100 : 0}
					<div class="flex-1 flex flex-col items-center gap-2">
						<div class="text-sm font-semibold text-brand-500">{month.count}</div>
						<div
							class="w-full bg-gradient-to-t from-brand-600 to-accent-500 rounded-t-lg transition-all hover:opacity-80"
							style="height: {heightPercent}%"
						></div>
						<div class="text-xs text-text-secondary">{month.month}</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="grid md:grid-cols-2 gap-8">
			<!-- Most Played Games -->
			<div>
				<h2 class="text-xl font-semibold mb-4">🏆 Most Played Games</h2>
				{#if mostPlayedGames.length === 0}
					<div class="card bg-surface-1 p-8 text-center text-text-secondary">
						No plays logged yet
					</div>
				{:else}
					<div class="space-y-3">
						{#each mostPlayedGames as item, index}
							<div class="card bg-surface-1 p-4 hover:bg-surface-2 transition-colors">
								<div class="flex items-center gap-4">
									<!-- Rank -->
									<div
										class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm {index === 0
											? 'bg-gradient-to-br from-yellow-500 to-orange-500'
											: index === 1
												? 'bg-gradient-to-br from-gray-400 to-gray-500'
												: index === 2
													? 'bg-gradient-to-br from-amber-600 to-amber-700'
													: 'bg-surface-3'}"
									>
										{index + 1}
									</div>

									<!-- Game Info -->
									<div class="flex-1">
										<div class="font-semibold">{item.game.name}</div>
										<div class="text-sm text-text-secondary">
											{item.playCount} {item.playCount === 1 ? 'play' : 'plays'} • 
											{formatDuration(item.totalMinutes)} total
											{#if item.avgMinutes > 0}
												• ~{item.avgMinutes}m avg
											{/if}
										</div>
									</div>

									<!-- Thumbnail -->
									{#if item.game.thumbnailUrl}
										<img
											src={item.game.thumbnailUrl}
											alt={item.game.name}
											class="w-12 h-12 rounded object-cover"
										/>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Recent Activity -->
			<div>
				<h2 class="text-xl font-semibold mb-4">🕐 Recent Activity</h2>
				{#if recentPlays.length === 0}
					<div class="card bg-surface-1 p-8 text-center text-text-secondary">
						No recent plays
					</div>
				{:else}
					<div class="space-y-3">
						{#each recentPlays as play}
							<div class="card bg-surface-1 p-4">
								<div class="flex items-center gap-3">
									{#if play.game.thumbnailUrl}
										<img
											src={play.game.thumbnailUrl}
											alt={play.game.name}
											class="w-10 h-10 rounded object-cover"
										/>
									{/if}
									<div class="flex-1">
										<div class="font-semibold text-sm">{play.game.name}</div>
										<div class="text-xs text-text-secondary">
											{formatDate(play.playedAt)}
											{#if play.durationMinutes}
												• {formatDuration(play.durationMinutes)}
											{/if}
											{#if play.players && play.players.length > 0}
												{@const winner = play.players.find((p) => p.winner)}
												{#if winner}
													• 🏆 {winner.name}
												{/if}
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Insights -->
		{#if totalPlays > 0}
			<div class="card bg-gradient-to-br from-brand-900/20 to-accent-900/20 border border-brand-500/30 p-6 mt-8">
				<h2 class="text-xl font-semibold mb-4">💡 Insights</h2>
				<div class="grid md:grid-cols-2 gap-4 text-sm">
					<div class="flex items-start gap-2">
						<span class="text-lg">🎯</span>
						<div>
							<div class="font-semibold">Collection Usage</div>
							<div class="text-text-secondary">
								You've played {mostPlayedGames.length} of your {totalGames} games ({Math.round((mostPlayedGames.length / totalGames) * 100)}%)
							</div>
						</div>
					</div>
					{#if mostPlayedGames.length > 0}
						<div class="flex items-start gap-2">
							<span class="text-lg">⭐</span>
							<div>
								<div class="font-semibold">Top Game</div>
								<div class="text-text-secondary">
									{mostPlayedGames[0].game.name} with {mostPlayedGames[0].playCount} plays
								</div>
							</div>
						</div>
					{/if}
					<div class="flex items-start gap-2">
						<span class="text-lg">📅</span>
						<div>
							<div class="font-semibold">Play Rate</div>
							<div class="text-text-secondary">
								{(totalPlays / 6).toFixed(1)} plays per month on average
							</div>
						</div>
					</div>
					<div class="flex items-start gap-2">
						<span class="text-lg">🎲</span>
						<div>
							<div class="font-semibold">Game Night Duration</div>
							<div class="text-text-secondary">
								Average session is {totalPlays > 0 ? formatDuration(Math.round((totalHours * 60) / totalPlays)) : '--'}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
