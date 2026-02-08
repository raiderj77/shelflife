<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/services/supabase';
	import { onMount } from 'svelte';

	let error = $state('');

	onMount(async () => {
		// Supabase will detect the token from the URL hash automatically
		// (detectSessionInUrl: true). We just need to wait for it.
		const { data, error: err } = await supabase.auth.getSession();

		if (err) {
			error = err.message;
			return;
		}

		if (data.session) {
			goto('/dashboard', { replaceState: true });
		} else {
			// No session — might need to exchange a code from the URL
			// Try getting session from URL hash (for implicit flow)
			const hash = window.location.hash;
			if (hash) {
				// Give Supabase a moment to process the hash
				await new Promise((r) => setTimeout(r, 500));
				const { data: retryData } = await supabase.auth.getSession();
				if (retryData.session) {
					goto('/dashboard', { replaceState: true });
					return;
				}
			}
			// Still no session, send to login
			goto('/login', { replaceState: true });
		}
	});
</script>

<div class="min-h-dvh flex items-center justify-center">
	<div class="text-center">
		{#if error}
			<div class="text-5xl mb-4">😕</div>
			<h1 class="text-xl font-bold mb-2">Authentication Error</h1>
			<p class="text-text-secondary mb-4">{error}</p>
			<a href="/login" class="text-brand-400 hover:text-brand-300 font-medium">Back to Sign In</a>
		{:else}
			<div class="text-4xl mb-4 animate-bounce">🎲</div>
			<p class="text-text-secondary text-sm">Signing you in...</p>
		{/if}
	</div>
</div>
