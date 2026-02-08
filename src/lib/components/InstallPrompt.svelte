<script lang="ts">
	import { onMount } from 'svelte';

	let deferredPrompt: any = $state(null);
	let showBanner = $state(false);
	let installing = $state(false);

	onMount(() => {
		// Don't show if already dismissed
		if (localStorage.getItem('pwa-install-dismissed')) return;

		// Don't show if already installed (standalone mode)
		if (window.matchMedia('(display-mode: standalone)').matches) return;

		const handler = (e: Event) => {
			e.preventDefault();
			deferredPrompt = e;
			showBanner = true;
		};

		window.addEventListener('beforeinstallprompt', handler);

		return () => {
			window.removeEventListener('beforeinstallprompt', handler);
		};
	});

	async function handleInstall() {
		if (!deferredPrompt) return;
		installing = true;
		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === 'accepted') {
			showBanner = false;
		}
		deferredPrompt = null;
		installing = false;
	}

	function handleDismiss() {
		showBanner = false;
		localStorage.setItem('pwa-install-dismissed', 'true');
	}
</script>

{#if showBanner}
	<div
		class="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-0 md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
	>
		<div
			class="flex items-center gap-4 rounded-2xl border border-brand-700/40 bg-surface-100/95 p-4 shadow-lg shadow-brand-900/20 backdrop-blur-md"
		>
			<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600/20">
				<span class="text-2xl">🎲</span>
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-semibold text-text-primary">Install ShelfLife</p>
				<p class="text-xs text-text-muted">Get the best experience with the app</p>
			</div>
			<div class="flex shrink-0 gap-2">
				<button
					onclick={handleDismiss}
					class="rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-secondary"
				>
					Later
				</button>
				<button
					onclick={handleInstall}
					disabled={installing}
					class="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50"
				>
					{installing ? 'Installing...' : 'Install'}
				</button>
			</div>
		</div>
	</div>
{/if}
