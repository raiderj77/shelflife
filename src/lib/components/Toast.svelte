<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toast, type ToastType } from '$lib/stores/toast.svelte';

	const typeStyles: Record<ToastType, { border: string; icon: string }> = {
		success: { border: 'border-l-green-500', icon: '✓' },
		error: { border: 'border-l-red-500', icon: '✕' },
		info: { border: 'border-l-brand-500', icon: 'ℹ' }
	};
</script>

{#if toast.toasts.length > 0}
	<div
		class="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-[100] flex flex-col gap-2 pointer-events-none"
	>
		{#each toast.toasts as t (t.id)}
			<div
				transition:fly={{ y: -20, duration: 250 }}
				class="pointer-events-auto bg-surface-100 border border-border border-l-4 {typeStyles[t.type]
					.border} rounded-lg shadow-lg px-4 py-3 flex items-start gap-3"
			>
				<span
					class="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
					{t.type === 'success' ? 'bg-green-500/20 text-green-400' : ''}
					{t.type === 'error' ? 'bg-red-500/20 text-red-400' : ''}
					{t.type === 'info' ? 'bg-brand-500/20 text-brand-400' : ''}"
				>
					{typeStyles[t.type].icon}
				</span>
				<span class="flex-1 text-sm text-text-primary">{t.message}</span>
				<button
					onclick={() => toast.remove(t.id)}
					class="shrink-0 text-text-muted hover:text-text-primary text-lg leading-none"
					aria-label="Dismiss"
				>
					&times;
				</button>
			</div>
		{/each}
	</div>
{/if}
