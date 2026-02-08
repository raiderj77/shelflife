<script lang="ts">
	import { syncStore } from '$lib/stores/sync.svelte';
</script>

<div class="flex items-center gap-2 text-xs px-2 py-1">
	{#if syncStore.status === 'syncing'}
		<div
			class="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-brand-400 border-t-transparent animate-spin"
		></div>
		<span class="text-text-muted">Syncing...</span>
	{:else if syncStore.status === 'offline'}
		<div class="h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-500"></div>
		<span class="text-text-muted">Offline</span>
	{:else if syncStore.status === 'error'}
		<div class="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"></div>
		<span class="text-text-muted truncate max-w-[150px]" title={syncStore.lastError}>
			Sync error
		</span>
	{:else if syncStore.pendingCount > 0}
		<div class="h-2.5 w-2.5 shrink-0 rounded-full bg-orange-400"></div>
		<span class="text-text-muted">{syncStore.pendingCount} pending</span>
	{:else}
		<div class="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500"></div>
		<span class="text-text-muted">Synced</span>
	{/if}
</div>
