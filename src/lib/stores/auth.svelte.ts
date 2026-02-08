import { supabase } from '$lib/supabase';
import type { User } from '@supabase/supabase-js';

class AuthStore {
	user = $state<User | null>(null);
	loading = $state(true);
	isLoggedIn = $derived(this.user !== null);

	async initialize() {
		this.loading = true;
		const {
			data: { session }
		} = await supabase.auth.getSession();
		this.user = session?.user ?? null;
		this.loading = false;

		// Listen for auth changes
		supabase.auth.onAuthStateChange((_event, session) => {
			this.user = session?.user ?? null;
		});
	}

	async signInWithGoogle() {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback`
			}
		});
		return { error };
	}

	async signInWithMagicLink(email: string) {
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${window.location.origin}/auth/callback`
			}
		});
		return { error };
	}

	async signOut() {
		await supabase.auth.signOut();
		this.user = null;
	}
}

export const auth = new AuthStore();
