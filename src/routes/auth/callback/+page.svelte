<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/services/supabase';
	import { onMount } from 'svelte';

	let error = $state('');

	onMount(async () => {
		const url = new URL(window.location.href);
		const code = url.searchParams.get('code');
		const errorParam = url.searchParams.get('error');
		const errorDescription = url.searchParams.get('error_description');

		// Handle error from Supabase/provider
		if (errorParam) {
			error = errorDescription || errorParam;
			return;
		}

		// PKCE flow: exchange the code for a session
		if (code) {
			const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
			if (exchangeError) {
				error = exchangeError.message;
				return;
			}
			goto('/dashboard', { replaceState: true });
			return;
		}

		// Implicit flow / magic link: token is in URL hash
		// detectSessionInUrl: true handles this automatically on client init
		// Wait for onAuthStateChange to fire
		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_IN' && session) {
				subscription.unsubscribe();
				goto('/dashboard', { replaceState: true });
			}
		});

		// Check if session already exists (e.g. hash was already processed)
		const { data } = await supabase.auth.getSession();
		if (data.session) {
			subscription.unsubscribe();
			goto('/dashboard', { replaceState: true });
			return;
		}

		// Timeout fallback — if nothing happens in 5 seconds, redirect to login
		setTimeout(() => {
			subscription.unsubscribe();
			if (!error) {
				goto('/login', { replaceState: true });
			}
		}, 5000);
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
