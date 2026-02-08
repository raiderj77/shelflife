<script lang="ts">
	let { variant = 'card', count = 1 }: { variant?: 'card' | 'row' | 'stat'; count?: number } =
		$props();
</script>

{#if variant === 'card'}
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
		{#each Array(count) as _}
			<div class="rounded-[var(--radius-card)] bg-surface-100 border border-surface-200 p-4 animate-pulse">
				<div class="aspect-square rounded-lg bg-surface-200 mb-3"></div>
				<div class="h-4 bg-surface-200 rounded w-3/4 mb-2"></div>
				<div class="h-3 bg-surface-200 rounded w-1/2"></div>
			</div>
		{/each}
	</div>
{:else if variant === 'row'}
	<div class="space-y-3">
		{#each Array(count) as _}
			<div class="rounded-lg bg-surface-100 border border-surface-200 p-4 flex items-center gap-4 animate-pulse">
				<div class="w-12 h-12 rounded bg-surface-200 shrink-0"></div>
				<div class="flex-1 space-y-2">
					<div class="h-4 bg-surface-200 rounded w-2/5"></div>
					<div class="h-3 bg-surface-200 rounded w-1/4"></div>
				</div>
				<div class="h-4 bg-surface-200 rounded w-16"></div>
			</div>
		{/each}
	</div>
{:else if variant === 'stat'}
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		{#each Array(count) as _}
			<div class="rounded-[var(--radius-card)] bg-surface-100 border border-surface-200 p-6 animate-pulse">
				<div class="flex items-center justify-between mb-3">
					<div class="h-3 bg-surface-200 rounded w-24"></div>
					<div class="w-8 h-8 bg-surface-200 rounded"></div>
				</div>
				<div class="h-8 bg-surface-200 rounded w-16"></div>
			</div>
		{/each}
	</div>
{/if}
