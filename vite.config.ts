import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.svg', 'icons/*.png'],
			manifest: {
				name: 'ShelfLife — Board Game Collection Manager',
				short_name: 'ShelfLife',
				description: 'Manage your board game collection, pick what to play, and track your gaming sessions',
				theme_color: '#0a0a0f',
				background_color: '#0a0a0f',
				display: 'standalone',
				orientation: 'any',
				categories: ['games', 'entertainment', 'lifestyle'],
				icons: [
					{ src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
					{ src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
					{ src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
					{ src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
					{ src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
					{ src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
					{ src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{ src: '/icons/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				],
				screenshots: [
					{
						src: '/icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						form_factor: 'wide',
						label: 'ShelfLife Dashboard'
					},
					{
						src: '/icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						form_factor: 'narrow',
						label: 'ShelfLife Mobile'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
				navigateFallback: null,
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'gstatic-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'supabase-api-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24 // 1 day
							},
							cacheableResponse: {
								statuses: [0, 200]
							},
							networkTimeoutSeconds: 10
						}
					},
					{
						urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
						handler: 'NetworkOnly'
					}
				]
			},
			devOptions: {
				enabled: true
			}
		})
	]
});
