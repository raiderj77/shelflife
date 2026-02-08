/**
 * ShelfLife — Supabase Database Types
 * 
 * These types mirror the Postgres tables in Supabase.
 * When you change the database schema, update these too.
 * 
 * Think of this as the "instruction manual" — it tells TypeScript
 * exactly what shape our data is so we get autocomplete and error checking.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SubscriptionTier = 'free' | 'pro';
export type CollectionStatus = 'owned' | 'wishlist' | 'for_trade' | 'want_to_buy';
export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface Database {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string;
					username: string | null;
					display_name: string | null;
					avatar_url: string | null;
					bgg_username: string | null;
					subscription_tier: SubscriptionTier;
					stripe_customer_id: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					username?: string | null;
					display_name?: string | null;
					avatar_url?: string | null;
					bgg_username?: string | null;
					subscription_tier?: SubscriptionTier;
					stripe_customer_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					username?: string | null;
					display_name?: string | null;
					avatar_url?: string | null;
					bgg_username?: string | null;
					subscription_tier?: SubscriptionTier;
					stripe_customer_id?: string | null;
					updated_at?: string;
				};
			};
			games: {
				Row: {
					id: number;
					bgg_id: number;
					name: string;
					year_published: number | null;
					min_players: number | null;
					max_players: number | null;
					playing_time: number | null;
					min_playtime: number | null;
					max_playtime: number | null;
					min_age: number | null;
					description: string | null;
					thumbnail_url: string | null;
					image_url: string | null;
					categories: string[];
					mechanics: string[];
					bgg_rating: number | null;
					bgg_weight: number | null;
				};
				Insert: {
					bgg_id: number;
					name: string;
					year_published?: number | null;
					min_players?: number | null;
					max_players?: number | null;
					playing_time?: number | null;
					min_playtime?: number | null;
					max_playtime?: number | null;
					min_age?: number | null;
					description?: string | null;
					thumbnail_url?: string | null;
					image_url?: string | null;
					categories?: string[];
					mechanics?: string[];
					bgg_rating?: number | null;
					bgg_weight?: number | null;
				};
				Update: Partial<Database['public']['Tables']['games']['Insert']>;
			};
			collection_games: {
				Row: {
					id: number;
					user_id: string;
					game_id: number;
					status: CollectionStatus;
					personal_rating: number | null;
					notes: string | null;
					added_at: string;
					updated_at: string;
					deleted_at: string | null;
				};
				Insert: {
					user_id: string;
					game_id: number;
					status?: CollectionStatus;
					personal_rating?: number | null;
					notes?: string | null;
					added_at?: string;
					updated_at?: string;
					deleted_at?: string | null;
				};
				Update: Partial<Database['public']['Tables']['collection_games']['Insert']>;
			};
			plays: {
				Row: {
					id: number;
					user_id: string;
					game_id: number;
					played_at: string;
					duration_minutes: number | null;
					players: Json;
					notes: string | null;
					photo_url: string | null;
					location: string | null;
					created_at: string;
					updated_at: string;
					deleted_at: string | null;
				};
				Insert: {
					user_id: string;
					game_id: number;
					played_at?: string;
					duration_minutes?: number | null;
					players?: Json;
					notes?: string | null;
					photo_url?: string | null;
					location?: string | null;
					created_at?: string;
					updated_at?: string;
					deleted_at?: string | null;
				};
				Update: Partial<Database['public']['Tables']['plays']['Insert']>;
			};
		};
	};
}

// Convenience type aliases — use these throughout the app
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Game = Database['public']['Tables']['games']['Row'];
export type CollectionGame = Database['public']['Tables']['collection_games']['Row'];
export type Play = Database['public']['Tables']['plays']['Row'];
