<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';

	let mobileMenuOpen = $state(false);

	// Initialize auth on mount
	onMount(async () => {
		await auth.initialize();
	});

	// Redirect to login if not authenticated
	$effect(() => {
		if (!auth.loading && !auth.isLoggedIn) {
			goto('/login');
		}
	});

	// Navigation items
	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: '📊' },
		{ href: '/collection', label: 'My Games', icon: '🎮' },
		{ href: '/stats', label: 'Stats', icon: '📈' },
		{ href: '/plays', label: 'Play History', icon: '📝' },
		{ href: '/pick', label: 'Pick a Game', icon: '🎲' },
		{ href: '/import', label: 'Import', icon: '📥' }
	];

	// Sign out
	async function handleSignOut() {
		await auth.signOut();
		goto('/login');
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

			<!-- User Profile -->
			<div class="p-4 border-t border-border">
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

		<!-- Mobile Header -->
		<div class="md:hidden fixed top-0 left-0 right-0 bg-surface-1 border-b border-border z-50">
			<div class="flex items-center justify-between p-4">
				<a href="/dashboard" class="flex items-center gap-2">
					<span class="text-2xl">🎲</span>
					<span class="text-lg font-bold">ShelfLife</span>
				</a>
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="btn btn-sm btn-ghost"
				>
					{mobileMenuOpen ? '✕' : '☰'}
				</button>
			</div>

			<!-- Mobile Menu -->
			{#if mobileMenuOpen}
				<div class="border-t border-border p-4">
					<nav class="space-y-2 mb-4">
						{#each navItems as item}
							<a
								href={item.href}
								onclick={() => (mobileMenuOpen = false)}
								class="flex items-center gap-3 px-4 py-3 rounded-lg {$page.url.pathname ===
								item.href
									? 'bg-accent-primary text-white'
									: 'text-text-secondary hover:bg-surface-2'}"
							>
								<span class="text-xl">{item.icon}</span>
								<span class="font-medium">{item.label}</span>
							</a>
						{/each}
					</nav>
					<button onclick={handleSignOut} class="btn btn-sm btn-ghost w-full">
						Sign Out
					</button>
				</div>
			{/if}
		</div>

		<!-- Main Content -->
		<main class="flex-1 md:pt-0 pt-16">
			<slot />
		</main>

		<InstallPrompt />
	</div>
{/if}
