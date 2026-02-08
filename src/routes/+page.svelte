<script lang="ts">
	import { goto } from '$app/navigation';

	// Sample game boxes for the grid - real board game titles
	const gameBoxes = [
		{ game: 'Wingspan', color: 'from-purple-600 to-pink-600', feature: 'Import from BGG', icon: '📥', desc: 'One click pulls your entire collection' },
		{ game: 'Catan', color: 'from-orange-600 to-red-600', feature: 'Pick What to Play', icon: '🎲', desc: 'Dice decides - no more arguments' },
		{ game: 'Pandemic', color: 'from-blue-600 to-cyan-600', feature: 'Log in 10 Seconds', icon: '⚡', desc: 'Tap game, add players, done' },
		{ game: 'Azul', color: 'from-indigo-600 to-purple-600', feature: 'Works Offline', icon: '📱', desc: 'Your shelf lives on your device' },
		{ game: '7 Wonders', color: 'from-amber-600 to-yellow-600', feature: 'Smart Filters', icon: '🔍', desc: 'Player count, time, mood' },
		{ game: 'Ticket to Ride', color: 'from-green-600 to-emerald-600', feature: 'Play Stats', icon: '📊', desc: 'See what you actually play' },
		{ game: 'Dominion', color: 'from-slate-600 to-gray-600', feature: 'Share Your Shelf', icon: '🔗', desc: 'Public collection links' },
		{ game: 'Codenames', color: 'from-rose-600 to-pink-600', feature: 'Free Forever', icon: '💜', desc: 'No ads, no BS, just games' },
	];

	let hoveredIndex = $state<number | null>(null);
</script>

<svelte:head>
	<title>ShelfLife - Your board games, finally organized</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-surface-0 via-surface-50 to-surface-100">
	<!-- Header -->
	<header class="border-b border-border/50 backdrop-blur-lg bg-surface-0/80 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="text-3xl">🎲</span>
				<span class="text-2xl font-bold bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">ShelfLife</span>
			</div>
			<div class="flex items-center gap-4">
				<a href="#features" class="text-text-secondary hover:text-text-primary transition-colors">Features</a>
				<a href="#pricing" class="text-text-secondary hover:text-text-primary transition-colors">Pricing</a>
				<button onclick={() => goto('/login')} class="btn-accent px-6 py-2 rounded-full font-semibold">
					Sign In
				</button>
			</div>
		</div>
	</header>

	<!-- Hero Section -->
	<section class="max-w-7xl mx-auto px-6 py-20 text-center">
		<div class="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 rounded-full text-sm text-text-secondary mb-8 border border-brand-500/20">
			<span class="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
			Free • Offline-first • No ads
		</div>

		<h1 class="text-6xl md:text-7xl font-bold mb-6 leading-tight">
			Your board games,<br />
			<span class="bg-gradient-to-r from-brand-500 via-accent-500 to-brand-600 bg-clip-text text-transparent">
				finally organized
			</span>
		</h1>

		<p class="text-xl text-text-secondary mb-12 max-w-2xl mx-auto">
			Import your collection. Pick what to play tonight. Log games in under 10 seconds.<br />
			<span class="text-text-primary font-semibold">Works offline, forever free.</span>
		</p>

		<div class="flex items-center justify-center gap-4 mb-16">
			<button onclick={() => goto('/login')} class="btn-accent px-8 py-4 rounded-full text-lg font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all">
				Get Started — It's Free
			</button>
			<a href="#demo" class="px-8 py-4 rounded-full border-2 border-surface-300 hover:border-brand-500 transition-colors text-lg font-semibold">
				See How It Works
			</a>
		</div>

		<div class="text-sm text-text-secondary">
			Tracking <span class="text-brand-500 font-bold">142,673</span> games across the community
		</div>
	</section>

	<!-- Interactive Game Grid -->
	<section class="max-w-6xl mx-auto px-6 py-20">
		<h2 class="text-4xl font-bold text-center mb-4">Your shelf, supercharged</h2>
		<p class="text-text-secondary text-center mb-12">
			Hover to see what makes ShelfLife different
		</p>

		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			{#each gameBoxes as box, i}
				<button
					onmouseenter={() => (hoveredIndex = i)}
					onmouseleave={() => (hoveredIndex = null)}
					class="group relative aspect-square rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105"
					style="perspective: 1000px;"
				>
					<div
						class="absolute inset-0 transition-transform duration-500 preserve-3d"
						style="transform-style: preserve-3d; transform: {hoveredIndex === i ? 'rotateY(180deg)' : 'rotateY(0deg)'}"
					>
						<!-- Front: Game box -->
						<div class="absolute inset-0 backface-hidden bg-gradient-to-br {box.color} p-6 flex flex-col items-center justify-center">
							<div class="text-6xl mb-4 group-hover:scale-110 transition-transform">🎲</div>
							<div class="text-white font-bold text-lg text-center">{box.game}</div>
						</div>

						<!-- Back: Feature -->
						<div class="absolute inset-0 backface-hidden bg-surface-100 border-2 border-brand-500/50 p-6 flex flex-col items-center justify-center" style="transform: rotateY(180deg)">
							<div class="text-5xl mb-3">{box.icon}</div>
							<div class="text-brand-400 font-bold text-sm mb-2">{box.feature}</div>
							<div class="text-text-secondary text-xs text-center">{box.desc}</div>
						</div>
					</div>
				</button>
			{/each}
		</div>
	</section>

	<!-- Problem/Solution -->
	<section class="max-w-6xl mx-auto px-6 py-20">
		<div class="bg-surface-100 rounded-3xl border border-brand-500/20 p-12">
			<h2 class="text-3xl font-bold mb-8 text-center">Built by a board gamer who was tired of</h2>
			
			<div class="grid md:grid-cols-2 gap-8 text-lg">
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<span class="text-2xl">😕</span>
						<div>
							<div class="font-semibold text-error-500 mb-1">30-minute debates about what to play</div>
							<div class="text-text-secondary text-sm">"I dunno, what do YOU want to play?"</div>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-2xl">📦</span>
						<div>
							<div class="font-semibold text-error-500 mb-1">Forgetting what games you own</div>
							<div class="text-text-secondary text-sm">Buying duplicates at conventions</div>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-2xl">🤷</span>
						<div>
							<div class="font-semibold text-error-500 mb-1">Playing the same 3 games every week</div>
							<div class="text-text-secondary text-sm">While 47 others collect dust</div>
						</div>
					</div>
				</div>

				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<span class="text-2xl">🎲</span>
						<div>
							<div class="font-semibold text-success-500 mb-1">Let the dice decide in 10 seconds</div>
							<div class="text-text-secondary text-sm">Set players & time, shake, done</div>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-2xl">📱</span>
						<div>
							<div class="font-semibold text-success-500 mb-1">Your whole shelf in your pocket</div>
							<div class="text-text-secondary text-sm">Works at the game store, offline</div>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-2xl">📊</span>
						<div>
							<div class="font-semibold text-success-500 mb-1">See what you actually play</div>
							<div class="text-text-secondary text-sm">Stats show your real favorites</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="max-w-4xl mx-auto px-6 py-20 text-center">
		<h2 class="text-5xl font-bold mb-6">Ready to organize your shelf?</h2>
		<p class="text-xl text-text-secondary mb-8">
			Free forever. No credit card. No BS.
		</p>
		<button onclick={() => goto('/login')} class="btn-accent px-12 py-5 rounded-full text-xl font-semibold shadow-2xl shadow-brand-500/40 hover:shadow-brand-500/60 transition-all">
			Get Started Now
		</button>
	</section>

	<!-- Footer -->
	<footer class="border-t border-border/50 bg-surface-0">
		<div class="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-text-secondary">
			<div class="flex items-center gap-2">
				<span class="text-xl">🎲</span>
				<span>ShelfLife • Made for game night</span>
			</div>
			<div class="flex gap-6">
				<a href="#faq" class="hover:text-text-primary transition-colors">FAQ</a>
				<a href="#blog" class="hover:text-text-primary transition-colors">Blog</a>
				<a href="#pricing" class="hover:text-text-primary transition-colors">Pricing</a>
			</div>
		</div>
	</footer>
</div>

<style>
	.backface-hidden {
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}

	.preserve-3d {
		transform-style: preserve-3d;
	}

	.btn-accent {
		background: linear-gradient(135deg, rgb(var(--color-brand-600)), rgb(var(--color-accent-500)));
		color: white;
		box-shadow: 0 0 30px rgba(147, 51, 234, 0.4);
		transition: all 0.3s ease;
	}

	.btn-accent:hover {
		box-shadow: 0 0 50px rgba(147, 51, 234, 0.6), 0 0 80px rgba(236, 72, 153, 0.3);
		transform: translateY(-2px);
	}
</style>
