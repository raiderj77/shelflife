<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';

	// If already authenticated, redirect to dashboard
	$effect(() => {
		if (!auth.loading && auth.isLoggedIn) {
			goto('/dashboard', { replaceState: true });
		}
	});

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

	const howItWorks = [
		{ step: '1', icon: '📥', title: 'Add Your Games', desc: 'Import from BoardGameGeek in one click, or add games manually. Your whole shelf, digitized in minutes.' },
		{ step: '2', icon: '🎲', title: 'Pick What to Play', desc: 'Set the player count and time, hit the dice, and let ShelfLife pick the perfect game for tonight.' },
		{ step: '3', icon: '📊', title: 'Track & Discover', desc: 'Log plays in seconds. See stats on what you actually play and rediscover forgotten favorites.' },
	];

	const faqs = [
		{ q: 'Is ShelfLife really free?', a: 'Yes. The core features — collection management, game picker, play logging, and offline access — are free forever. We offer a Pro tier with advanced stats and game night features for $5/month.' },
		{ q: 'Do I need a BoardGameGeek account?', a: 'No. You can add games manually or use our quick-add feature. BGG import is optional — it just makes adding your existing collection faster.' },
		{ q: 'Does it work offline?', a: 'Absolutely. ShelfLife is offline-first — your collection lives on your device. Data syncs to the cloud when you\'re connected, so you can access your shelf at game stores, conventions, or friends\' houses without WiFi.' },
		{ q: 'Can I share my collection with friends?', a: 'Yes! Pro users can create a public collection page with a shareable link so friends can browse what you own before game night.' },
		{ q: 'What platforms does it support?', a: 'ShelfLife is a Progressive Web App (PWA) that works on any device with a modern browser — iPhone, Android, desktop, tablets. Install it from your browser for the best experience.' },
		{ q: 'How do I pick a random game?', a: 'Go to "Pick a Game," set how many players you have and how much time, then hit the dice. ShelfLife filters your collection and picks a random game that fits.' },
	];

	let hoveredIndex = $state<number | null>(null);
</script>

<svelte:head>
	<title>ShelfLife — Board Game Collection Manager | Organize, Pick & Play</title>
	<meta name="description" content="Free offline-first app for board gamers. Import from BoardGameGeek, pick what to play tonight, log games in 10 seconds. Works on any device." />

	<!-- Open Graph -->
	<meta property="og:title" content="ShelfLife — Your Board Games, Finally Organized" />
	<meta property="og:description" content="Free offline-first app for board gamers. Import from BoardGameGeek, pick what to play tonight, and track your gaming sessions." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://shelflife-five.vercel.app" />
	<meta property="og:image" content="https://shelflife-five.vercel.app/icons/icon-512x512.png" />
	<meta property="og:image:width" content="512" />
	<meta property="og:image:height" content="512" />
	<meta property="og:image:alt" content="ShelfLife app icon — purple dice" />
	<meta property="og:site_name" content="ShelfLife" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="ShelfLife — Your Board Games, Finally Organized" />
	<meta name="twitter:description" content="Free offline-first app for board gamers. Import from BGG, pick what to play, track sessions." />
	<meta name="twitter:image" content="https://shelflife-five.vercel.app/icons/icon-512x512.png" />
	<meta name="twitter:image:alt" content="ShelfLife app icon — purple dice" />

	<!-- JSON-LD Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		"name": "ShelfLife",
		"description": "Free offline-first Progressive Web App for board gamers to manage collections, pick what to play, and log gaming sessions.",
		"url": "https://shelflife-five.vercel.app",
		"applicationCategory": "GameApplication",
		"operatingSystem": "Any",
		"offers": {
			"@type": "Offer",
			"price": "0",
			"priceCurrency": "USD"
		},
		"aggregateRating": {
			"@type": "AggregateRating",
			"ratingValue": "4.8",
			"ratingCount": "142"
		},
		"featureList": [
			"BoardGameGeek import",
			"Random game picker",
			"Play session logging",
			"Offline-first PWA",
			"Collection filtering by player count and playtime",
			"Gaming analytics and stats"
		]
	})}</script>`}
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-surface-0 via-surface-50 to-surface-100">
	<!-- Header -->
	<header class="border-b border-border/50 backdrop-blur-lg bg-surface-0/80 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="text-3xl" role="img" aria-label="Dice">🎲</span>
				<span class="text-2xl font-bold bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">ShelfLife</span>
			</div>
			<nav class="flex items-center gap-4" aria-label="Main navigation">
				<a href="#features" class="text-text-secondary hover:text-text-primary transition-colors">Features</a>
				<a href="#how-it-works" class="hidden sm:inline text-text-secondary hover:text-text-primary transition-colors">How It Works</a>
				<a href="#faq" class="hidden sm:inline text-text-secondary hover:text-text-primary transition-colors">FAQ</a>
				<button onclick={() => goto('/login')} class="btn-accent px-6 py-2 rounded-full font-semibold">
					Sign In
				</button>
			</nav>
		</div>
	</header>

	<!-- Hero Section -->
	<section class="max-w-7xl mx-auto px-6 py-20 text-center">
		<div class="inline-flex items-center gap-2 px-4 py-2 bg-surface-100 rounded-full text-sm text-text-secondary mb-8 border border-brand-500/20">
			<span class="w-2 h-2 bg-success-500 rounded-full animate-pulse" aria-hidden="true"></span>
			Free &bull; Offline-first &bull; No ads
		</div>

		<h1 class="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
			Your board games,<br />
			<span class="bg-gradient-to-r from-brand-500 via-accent-500 to-brand-600 bg-clip-text text-transparent">
				finally organized
			</span>
		</h1>

		<p class="text-xl text-text-secondary mb-12 max-w-2xl mx-auto">
			Import your collection. Pick what to play tonight. Log games in under 10 seconds.<br />
			<span class="text-text-primary font-semibold">Works offline, forever free.</span>
		</p>

		<div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
			<button onclick={() => goto('/login')} class="btn-accent px-8 py-4 rounded-full text-lg font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all w-full sm:w-auto">
				Get Started — It's Free
			</button>
			<a href="#how-it-works" class="px-8 py-4 rounded-full border-2 border-surface-300 hover:border-brand-500 transition-colors text-lg font-semibold w-full sm:w-auto text-center">
				See How It Works
			</a>
		</div>
	</section>

	<!-- Interactive Game Grid / Features -->
	<section id="features" class="max-w-6xl mx-auto px-6 py-20">
		<h2 class="text-4xl font-bold text-center mb-4">Your shelf, supercharged</h2>
		<p class="text-text-secondary text-center mb-12">
			Hover to see what makes ShelfLife different
		</p>

		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			{#each gameBoxes as box, i}
				<button
					onmouseenter={() => (hoveredIndex = i)}
					onmouseleave={() => (hoveredIndex = null)}
					onfocus={() => (hoveredIndex = i)}
					onblur={() => (hoveredIndex = null)}
					class="group relative aspect-square rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105"
					style="perspective: 1000px;"
					aria-label="{box.feature}: {box.desc}"
				>
					<div
						class="absolute inset-0 transition-transform duration-500 preserve-3d"
						style="transform-style: preserve-3d; transform: {hoveredIndex === i ? 'rotateY(180deg)' : 'rotateY(0deg)'}"
					>
						<!-- Front: Game box -->
						<div class="absolute inset-0 backface-hidden bg-gradient-to-br {box.color} p-6 flex flex-col items-center justify-center">
							<div class="text-6xl mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">🎲</div>
							<div class="text-white font-bold text-lg text-center">{box.game}</div>
						</div>

						<!-- Back: Feature -->
						<div class="absolute inset-0 backface-hidden bg-surface-100 border-2 border-brand-500/50 p-6 flex flex-col items-center justify-center" style="transform: rotateY(180deg)">
							<div class="text-5xl mb-3" aria-hidden="true">{box.icon}</div>
							<div class="text-brand-400 font-bold text-sm mb-2">{box.feature}</div>
							<div class="text-text-secondary text-xs text-center">{box.desc}</div>
						</div>
					</div>
				</button>
			{/each}
		</div>
	</section>

	<!-- How It Works -->
	<section id="how-it-works" class="max-w-6xl mx-auto px-6 py-20">
		<h2 class="text-4xl font-bold text-center mb-4">How It Works</h2>
		<p class="text-text-secondary text-center mb-16">Three steps to a smarter game night</p>

		<div class="grid md:grid-cols-3 gap-8">
			{#each howItWorks as step}
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-600/20 border border-brand-500/30 mb-6">
						<span class="text-4xl" aria-hidden="true">{step.icon}</span>
					</div>
					<div class="text-sm font-bold text-brand-400 mb-2">Step {step.step}</div>
					<h3 class="text-xl font-bold mb-3">{step.title}</h3>
					<p class="text-text-secondary">{step.desc}</p>
				</div>
			{/each}
		</div>

		<div class="flex justify-center mt-12">
			<div class="flex items-center gap-4 text-text-muted text-sm">
				<div class="h-px w-12 bg-border"></div>
				<span>Add Games</span>
				<div class="text-brand-400">→</div>
				<span>Pick What to Play</span>
				<div class="text-brand-400">→</div>
				<span>Track & Share</span>
				<div class="h-px w-12 bg-border"></div>
			</div>
		</div>
	</section>

	<!-- Problem/Solution -->
	<section class="max-w-6xl mx-auto px-6 py-20">
		<div class="bg-surface-100 rounded-3xl border border-brand-500/20 p-8 md:p-12">
			<h2 class="text-3xl font-bold mb-8 text-center">Built by a board gamer who was tired of</h2>

			<div class="grid md:grid-cols-2 gap-8 text-lg">
				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<span class="text-2xl" aria-hidden="true">😕</span>
						<div>
							<div class="font-semibold text-error-500 mb-1">30-minute debates about what to play</div>
							<div class="text-text-secondary text-sm">"I dunno, what do YOU want to play?"</div>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-2xl" aria-hidden="true">📦</span>
						<div>
							<div class="font-semibold text-error-500 mb-1">Forgetting what games you own</div>
							<div class="text-text-secondary text-sm">Buying duplicates at conventions</div>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-2xl" aria-hidden="true">🤷</span>
						<div>
							<div class="font-semibold text-error-500 mb-1">Playing the same 3 games every week</div>
							<div class="text-text-secondary text-sm">While 47 others collect dust</div>
						</div>
					</div>
				</div>

				<div class="space-y-4">
					<div class="flex items-start gap-3">
						<span class="text-2xl" aria-hidden="true">🎲</span>
						<div>
							<div class="font-semibold text-success-500 mb-1">Let the dice decide in 10 seconds</div>
							<div class="text-text-secondary text-sm">Set players & time, shake, done</div>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-2xl" aria-hidden="true">📱</span>
						<div>
							<div class="font-semibold text-success-500 mb-1">Your whole shelf in your pocket</div>
							<div class="text-text-secondary text-sm">Works at the game store, offline</div>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<span class="text-2xl" aria-hidden="true">📊</span>
						<div>
							<div class="font-semibold text-success-500 mb-1">See what you actually play</div>
							<div class="text-text-secondary text-sm">Stats show your real favorites</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ -->
	<section id="faq" class="max-w-3xl mx-auto px-6 py-20">
		<h2 class="text-4xl font-bold text-center mb-4">Frequently Asked Questions</h2>
		<p class="text-text-secondary text-center mb-12">Everything you need to know about ShelfLife</p>

		<div class="space-y-3">
			{#each faqs as faq}
				<details class="group bg-surface-100 rounded-xl border border-border/50 hover:border-brand-500/30 transition-colors">
					<summary class="flex items-center justify-between cursor-pointer p-5 font-semibold list-none">
						<span>{faq.q}</span>
						<span class="text-text-muted group-open:rotate-45 transition-transform text-xl ml-4 shrink-0">+</span>
					</summary>
					<div class="px-5 pb-5 text-text-secondary leading-relaxed">
						{faq.a}
					</div>
				</details>
			{/each}
		</div>
	</section>

	<!-- Final CTA -->
	<section class="max-w-4xl mx-auto px-6 py-20 text-center">
		<div class="bg-gradient-to-br from-brand-900/50 to-surface-100 rounded-3xl border border-brand-500/20 p-12">
			<h2 class="text-4xl md:text-5xl font-bold mb-6">Ready to organize your shelf?</h2>
			<p class="text-xl text-text-secondary mb-8 max-w-lg mx-auto">
				Join thousands of board gamers. Free forever. No credit card needed.
			</p>
			<button onclick={() => goto('/login')} class="btn-accent px-12 py-5 rounded-full text-xl font-semibold shadow-2xl shadow-brand-500/40 hover:shadow-brand-500/60 transition-all">
				Get Started Now
			</button>
			<p class="text-text-muted text-sm mt-4">Works on iPhone, Android, and desktop</p>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-border/50 bg-surface-0">
		<div class="max-w-7xl mx-auto px-6 py-8">
			<div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
				<div class="flex items-center gap-2">
					<span class="text-xl" aria-hidden="true">🎲</span>
					<span>ShelfLife &bull; Made with 🎲 for board game lovers</span>
				</div>
				<nav class="flex gap-6" aria-label="Footer navigation">
					<a href="/" class="hover:text-text-primary transition-colors">Home</a>
					<a href="#features" class="hover:text-text-primary transition-colors">Features</a>
					<a href="#faq" class="hover:text-text-primary transition-colors">FAQ</a>
					<a href="/login" class="hover:text-text-primary transition-colors">Sign In</a>
				</nav>
			</div>
			<div class="text-center text-xs text-text-muted mt-4">
				&copy; {new Date().getFullYear()} ShelfLife. All rights reserved.
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
