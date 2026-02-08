<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { syncStore } from '$lib/stores/sync.svelte';
	import { onMount } from 'svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';
	import SyncStatus from '$lib/components/SyncStatus.svelte';
	import OnboardingModal from '$lib/components/OnboardingModal.svelte';

	let mobileMenuOpen = $state(false);
	let showOnboarding = $state(false);
	let onboardingChecked = false;

	// Initialize auth on mount
	onMount(async () => {
		await auth.initialize();
	});

	// Redirect to login if not authenticated, init sync when logged in
	$effect(() => {
		if (!auth.loading && auth.isLoggedIn && auth.user) {
			syncStore.initialize(auth.user.id);
			// Check onboarding (only once)
			if (!onboardingChecked) {
				onboardingChecked = true;
				const key = `shelflife-onboarding-complete-${auth.user.id}`;
				if (!localStorage.getItem(key)) {
					showOnboarding = true;
				}
			}
		}
		if (!auth.loading && !auth.isLoggedIn) {
			syncStore.destroy();
			goto('/login');
		}
	});

	// Navigation items (sidebar — all routes)
	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: '📊' },
		{ href: '/collection', label: 'My Games', icon: '🎮' },
		{ href: '/stats', label: 'Stats', icon: '📈' },
		{ href: '/plays', label: 'Play History', icon: '📝' },
		{ href: '/pick', label: 'Pick a Game', icon: '🎲' },
		{ href: '/import', label: 'Import', icon: '📥' }
	];

	// Bottom nav items (mobile — top 5 routes)
	const bottomNavItems = [
		{ href: '/dashboard', label: 'Home', icon: '📊' },
		{ href: '/collection', label: 'Games', icon: '🎮' },
		{ href: '/pick', label: 'Pick', icon: '🎲' },
		{ href: '/plays', label: 'Plays', icon: '📝' },
		{ href: '/stats', label: 'Stats', icon: '📈' }
	];

	// Sign out
	async function handleSignOut() {
		mobileMenuOpen = false;
		syncStore.destroy();
		await auth.signOut();
		goto('/login');
	}

	function completeOnboarding() {
		if (auth.user) {
			localStorage.setItem(`shelflife-onboarding-complete-${auth.user.id}`, 'true');
		}
		showOnboarding = false;
	}
</script>

{#if auth.loading}
	<div class="min-h-dvh flex items-center justify-center">
		<div class="text-center">
			<div class="text-4xl mb-4 animate-bounce">🎲</div>
			<p class="text-text-secondary text-sm">Loading ShelfLife...</p>
		</div>
	</div>
{:else if auth.isLoggedIn}
	<div class="min-h-dvh flex">
		<!-- Desktop Sidebar -->
		<aside class="hidden md:flex md:flex-col w-64 bg-surface-1 border-r border-border">
			<!-- Logo -->
			<div class="p-6 border-b border-border">
				<a href="/dashboard" class="flex items-center gap-3">
					<span class="text-3xl">🎲</span>
					<span class="text-xl font-bold">ShelfLife</span>
				</a>
			</div>

			<!-- Navigation -->
			<nav class="flex-1 p-4">
				<ul class="space-y-2">
					{#each navItems as item}
						<li>
							<a
								href={item.href}
								class="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors {$page.url
									.pathname === item.href
									? 'bg-accent-primary text-white'
									: 'text-text-secondary hover:bg-surface-2'}"
							>
								<span class="text-xl">{item.icon}</span>
								<span class="font-medium">{item.label}</span>
							</a>
						</li>
					{/each}
				</ul>
			</nav>

			<!-- Sync Status + User Profile -->
			<div class="p-4 border-t border-border">
				<div class="mb-3">
					<SyncStatus />
				</div>
				<div class="flex items-center gap-3 mb-3">
					{#if auth.user?.user_metadata?.avatar_url}
						<img
							src={auth.user.user_metadata.avatar_url}
							alt={auth.user.email}
							class="w-10 h-10 rounded-full"
						/>
					{:else}
						<div class="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center">
							<span class="text-white font-semibold">
								{auth.user?.email?.charAt(0).toUpperCase()}
							</span>
						</div>
					{/if}
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium truncate">{auth.user?.email}</div>
					</div>
				</div>
				<button onclick={handleSignOut} class="btn btn-sm btn-ghost w-full"> Sign Out </button>
			</div>
		</aside>

		<!-- Mobile Header (simplified — no nav items, just logo + menu toggle) -->
		<div class="md:hidden fixed top-0 left-0 right-0 bg-surface-1 border-b border-border z-50">
			<div class="flex items-center justify-between p-4">
				<div class="flex items-center gap-3">
					<a href="/dashboard" class="flex items-center gap-2">
						<span class="text-2xl">🎲</span>
						<span class="text-lg font-bold">ShelfLife</span>
					</a>
					<SyncStatus />
				</div>
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="btn btn-sm btn-ghost"
					aria-label="Menu"
				>
					{mobileMenuOpen ? '✕' : '☰'}
				</button>
			</div>

			<!-- Mobile Dropdown Menu (user actions + import) -->
			{#if mobileMenuOpen}
				<div class="border-t border-border p-4">
					<div class="flex items-center gap-3 mb-4">
						{#if auth.user?.user_metadata?.avatar_url}
							<img
								src={auth.user.user_metadata.avatar_url}
								alt={auth.user.email}
								class="w-8 h-8 rounded-full"
							/>
						{:else}
							<div class="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center">
								<span class="text-white text-sm font-semibold">
									{auth.user?.email?.charAt(0).toUpperCase()}
								</span>
							</div>
						{/if}
						<div class="text-sm text-text-secondary truncate">{auth.user?.email}</div>
					</div>
					<a
						href="/import"
						onclick={() => (mobileMenuOpen = false)}
						class="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-surface-2 mb-2"
					>
						<span class="text-xl">📥</span>
						<span class="font-medium">Import Games</span>
					</a>
					<button onclick={handleSignOut} class="btn btn-sm btn-ghost w-full">
						Sign Out
					</button>
				</div>
			{/if}
		</div>

		<!-- Main Content -->
		<main class="flex-1 md:pt-0 pt-16 pb-20 md:pb-0">
			<slot />
		</main>

		<!-- Mobile Bottom Nav -->
		<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-surface-1 border-t border-border z-50" aria-label="Main navigation">
			<div class="flex items-center justify-around py-1.5">
				{#each bottomNavItems as item}
					<a
						href={item.href}
						class="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg min-w-[56px] transition-colors
							{$page.url.pathname === item.href
							? 'text-brand-400'
							: 'text-text-muted hover:text-text-secondary'}"
					>
						<span class="text-xl leading-none">{item.icon}</span>
						<span class="text-[10px] font-medium">{item.label}</span>
					</a>
				{/each}
			</div>
		</nav>

		<InstallPrompt />
	</div>

	{#if showOnboarding}
		<OnboardingModal onComplete={completeOnboarding} />
	{/if}
{/if}
