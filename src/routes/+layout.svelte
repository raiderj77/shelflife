<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';

	let { children } = $props();

	onMount(() => {
		auth.initialize();
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<title>ShelfLife — Your Board Game Collection, Organized</title>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="ShelfLife" />
</svelte:head>

{@render children()}
