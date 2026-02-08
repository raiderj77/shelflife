<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/services/supabase';
	import { onMount } from 'svelte';

	let error = $state('');

	onMount(async () => {
		// Check for error params from the provider (query or hash)
		const params = new URLSearchParams(window.location.search);
		const hashParams = new URLSearchParams(window.location.hash.substring(1));

		const errorParam = params.get('error') || hashParams.get('error');
		const errorDescription =
			params.get('error_description') || hashParams.get('error_description');

		if (errorParam) {
			error = errorDescription || errorParam;
			return;
		}

		// With implicit flow + detectSessionInUrl: true, the Supabase client
		// automatically processes the #access_token hash on initialization.
		// Listen for the session to become available.
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (session) {
				subscription.unsubscribe();
				goto('/dashboard', { replaceState: true });
			}
		});

		// Session may already be available if detectSessionInUrl processed the hash
		const { data } = await supabase.auth.getSession();
		if (data.session) {
			subscription.unsubscribe();
			goto('/dashboard', { replaceState: true });
			return;
		}

		// Timeout — if nothing happens in 5 seconds, redirect to login
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
			<a href="/login" class="text-brand-400 hover:text-brand-300 font-medium"
				>Back to Sign In</a
			>
		{:else}
			<div class="text-4xl mb-4 animate-bounce">🎲</div>
			<p class="text-text-secondary text-sm">Signing you in...</p>
		{/if}
	</div>
</div>
