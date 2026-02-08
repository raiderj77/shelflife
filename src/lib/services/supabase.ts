import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './supabase-types';

/**
 * Supabase client for browser-side usage.
 * Used in components and client-side stores.
 * 
 * Think of this as the "phone line" to your cloud database.
 * Dexie (IndexedDB) is the local shelf — this is the backup in the sky.
 */
export const supabase = createClient<Database>(
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY,
	{
		auth: {
			// Use implicit flow — returns #access_token in URL hash
			// PKCE (the default in v2.48+) is fragile in SPAs due to
			// code verifier loss during the full-page redirect chain
			flowType: 'implicit',
			// Persist session in localStorage so users stay logged in
			persistSession: true,
			// Auto-refresh tokens before they expire
			autoRefreshToken: true,
			// Detect session from URL hash (for OAuth redirects)
			detectSessionInUrl: true
		}
	}
);
