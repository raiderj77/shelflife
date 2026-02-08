import Dexie, { type EntityTable } from 'dexie';

/**
 * ShelfLife — Offline Database (Dexie.js / IndexedDB)
 * 
 * This is the LOCAL source of truth. Every action hits this first,
 * then syncs to Supabase in the background.
 * 
 * Think of it like this:
 * - Dexie = the game shelf in your house (always there, instant access)
 * - Supabase = the cloud backup (syncs when online)
 * 
 * Why offline-first? (MyCrochetKit lesson)
 * - Game stores have terrible signal
 * - Friends' houses might not share WiFi
 * - App feels INSTANT because no network wait
 */

// ============================================
// Types for local database records
// ============================================

export interface LocalGame {
	/** Local auto-increment ID */
	id?: number;
	/** BoardGameGeek ID (unique identifier from BGG) */
	bggId: number;
	/** Game name */
	name: string;
	/** Year the game was published */
	yearPublished?: number;
	/** Minimum number of players */
	minPlayers?: number;
	/** Maximum number of players */
	maxPlayers?: number;
	/** Average playing time in minutes */
	playingTime?: number;
	/** Minimum playing time */
	minPlaytime?: number;
	/** Maximum playing time */
	maxPlaytime?: number;
	/** Minimum recommended age */
	minAge?: number;
	/** Game description from BGG */
	description?: string;
	/** Small image URL */
	thumbnailUrl?: string;
	/** Full-size image URL */
	imageUrl?: string;
	/** Category tags (e.g., "Strategy", "Family") */
	categories: string[];
	/** Mechanic tags (e.g., "Dice Rolling", "Worker Placement") */
	mechanics: string[];
	/** BGG community rating (1-10) */
	bggRating?: number;
	/** BGG weight/complexity (1-5) */
	bggWeight?: number;
}

export interface LocalCollectionGame {
	/** Local auto-increment ID */
	id?: number;
	/** References LocalGame.bggId */
	bggId: number;
	/** Collection status */
	status: 'owned' | 'wishlist' | 'for_trade' | 'want_to_buy';
	/** User's personal rating (1-10) */
	personalRating?: number;
	/** User's notes about this game */
	notes?: string;
	/** When the game was added to collection */
	addedAt: Date;
	/** Last updated */
	updatedAt: Date;
	/** Sync status with Supabase */
	syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface LocalPlay {
	/** Local auto-increment ID */
	id?: number;
	/** References LocalGame.bggId */
	bggId: number;
	/** When the game was played */
	playedAt: Date;
	/** How long the session lasted (minutes) */
	durationMinutes?: number;
	/** Players in this session */
	players: Array<{
		name: string;
		score?: number;
		winner?: boolean;
	}>;
	/** Notes about the session */
	notes?: string;
	/** Photo URL (local blob or cloud URL) */
	photoUrl?: string;
	/** Where the game was played */
	location?: string;
	/** When this record was created */
	createdAt: Date;
	/** Sync status with Supabase */
	syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface LocalSettings {
	/** Settings key */
	key: string;
	/** Settings value (any JSON-serializable data) */
	value: unknown;
}

// ============================================
// Database Definition
// ============================================

class ShelfLifeDB extends Dexie {
	games!: EntityTable<LocalGame, 'id'>;
	collection!: EntityTable<LocalCollectionGame, 'id'>;
	plays!: EntityTable<LocalPlay, 'id'>;
	settings!: EntityTable<LocalSettings, 'key'>;

	constructor() {
		super('ShelfLifeDB');

		// Version 1 — Initial schema
		// The stuff after ++ is auto-increment, & is unique, * is multi-entry
		this.version(1).stores({
			// Games master table: auto-ID, unique BGG ID, indexed by name
			games: '++id, &bggId, name, minPlayers, maxPlayers, playingTime, bggRating, *categories, *mechanics',

			// User's collection: auto-ID, unique BGG ID, indexed for filtering
			collection: '++id, &bggId, status, personalRating, addedAt, syncStatus',

			// Play logs: auto-ID, indexed by game and date
			plays: '++id, bggId, playedAt, syncStatus',

			// App settings: key-value store
			settings: 'key'
		});
	}
}

// ============================================
// Single database instance (singleton)
// ============================================

export const db = new ShelfLifeDB();

// ============================================
// Helper Functions
// ============================================

/**
 * Get a game by its BoardGameGeek ID
 */
export async function getGameByBggId(bggId: number): Promise<LocalGame | undefined> {
	return db.games.where('bggId').equals(bggId).first();
}

/**
 * Get all games in the user's collection
 */
export async function getCollection(): Promise<(LocalCollectionGame & { game: LocalGame })[]> {
	const collectionItems = await db.collection.toArray();
	const results = [];

	for (const item of collectionItems) {
		const game = await db.games.where('bggId').equals(item.bggId).first();
		if (game) {
			results.push({ ...item, game });
		}
	}

	return results;
}

/**
 * Get collection items filtered by criteria
 */
export async function getFilteredCollection(filters: {
	playerCount?: number;
	maxPlaytime?: number;
	search?: string;
	status?: string;
}): Promise<(LocalCollectionGame & { game: LocalGame })[]> {
	const all = await getCollection();

	return all.filter((item) => {
		// Filter by player count
		if (filters.playerCount) {
			if (item.game.minPlayers && item.game.maxPlayers) {
				if (filters.playerCount < item.game.minPlayers || filters.playerCount > item.game.maxPlayers) {
					return false;
				}
			}
		}

		// Filter by max playtime
		if (filters.maxPlaytime) {
			if (item.game.playingTime && item.game.playingTime > filters.maxPlaytime) {
				return false;
			}
		}

		// Filter by search term
		if (filters.search) {
			const searchLower = filters.search.toLowerCase();
			if (!item.game.name.toLowerCase().includes(searchLower)) {
				return false;
			}
		}

		// Filter by collection status
		if (filters.status && item.status !== filters.status) {
			return false;
		}

		return true;
	});
}

/**
 * Pick a random game from the collection (with optional filters)
 */
export async function pickRandomGame(filters?: {
	playerCount?: number;
	maxPlaytime?: number;
}): Promise<(LocalCollectionGame & { game: LocalGame }) | null> {
	const filtered = await getFilteredCollection({
		...filters,
		status: 'owned'
	});

	if (filtered.length === 0) return null;

	const randomIndex = Math.floor(Math.random() * filtered.length);
	return filtered[randomIndex];
}

/**
 * Add a game to the collection
 */
export async function addToCollection(
	game: Omit<LocalGame, 'id'>,
	status: LocalCollectionGame['status'] = 'owned'
): Promise<void> {
	// Upsert the game data
	const existing = await db.games.where('bggId').equals(game.bggId).first();
	if (!existing) {
		await db.games.add(game);
	} else {
		await db.games.where('bggId').equals(game.bggId).modify(game);
	}

	// Add to collection (if not already there)
	const inCollection = await db.collection.where('bggId').equals(game.bggId).first();
	if (!inCollection) {
		await db.collection.add({
			bggId: game.bggId,
			status,
			addedAt: new Date(),
			updatedAt: new Date(),
			syncStatus: 'pending'
		});
	}
}

/**
 * Remove a game from the collection
 */
export async function removeFromCollection(bggId: number): Promise<void> {
	await db.collection.where('bggId').equals(bggId).delete();
}

/**
 * Log a play
 */
export async function logPlay(play: Omit<LocalPlay, 'id' | 'createdAt' | 'syncStatus'>): Promise<number> {
	return await db.plays.add({
		...play,
		createdAt: new Date(),
		syncStatus: 'pending'
	});
}

/**
 * Get play history for a specific game
 */
export async function getPlaysForGame(bggId: number): Promise<LocalPlay[]> {
	return db.plays.where('bggId').equals(bggId).reverse().sortBy('playedAt');
}

/**
 * Get recent plays across all games
 */
export async function getRecentPlays(limit: number = 10): Promise<(LocalPlay & { game: LocalGame })[]> {
	const plays = await db.plays.orderBy('playedAt').reverse().limit(limit).toArray();
	const results = [];

	for (const play of plays) {
		const game = await db.games.where('bggId').equals(play.bggId).first();
		if (game) {
			results.push({ ...play, game });
		}
	}

	return results;
}

/**
 * Get a setting value
 */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
	const setting = await db.settings.get(key);
	return setting ? (setting.value as T) : defaultValue;
}

/**
 * Set a setting value
 */
export async function setSetting(key: string, value: unknown): Promise<void> {
	await db.settings.put({ key, value });
}

/**
 * Get total counts for dashboard stats
 */
export async function getStats(): Promise<{
	totalGames: number;
	totalPlays: number;
	uniqueGamesPlayed: number;
}> {
	const totalGames = await db.collection.where('status').equals('owned').count();
	const totalPlays = await db.plays.count();
	const uniqueBggIds = new Set((await db.plays.toArray()).map((p) => p.bggId));

	return {
		totalGames,
		totalPlays,
		uniqueGamesPlayed: uniqueBggIds.size
	};
}

/**
 * Clear all local data (for logout or reset)
 */
export async function clearAllData(): Promise<void> {
	await db.games.clear();
	await db.collection.clear();
	await db.plays.clear();
	await db.settings.clear();
}
