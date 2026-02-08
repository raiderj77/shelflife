import { XMLParser } from 'fast-xml-parser';
import type { LocalGame } from '$lib/db/schema';

/**
 * BGG Service — Handles all BoardGameGeek API communication
 * 
 * Talks to our /api/bgg proxy (which talks to BGG's XML API).
 * Parses XML responses into our LocalGame format.
 * 
 * BGG's API is XML-based and has quirks:
 * - Collections return 202 (queued) the first time — you have to retry
 * - Search results don't include full game details — need a second call
 * - Rate limiting exists but is generous
 */

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	isArray: (name) => {
		// These elements can appear once or many times in BGG XML
		return ['item', 'link', 'name'].includes(name);
	}
});

// ============================================
// Collection Import
// ============================================

export interface ImportProgress {
	status: 'loading' | 'queued' | 'parsing' | 'done' | 'error';
	message: string;
	total: number;
	imported: number;
}

/**
 * Import a user's collection from BGG.
 * Handles the 202 retry dance automatically.
 * Calls the progress callback so the UI can show what's happening.
 */
export async function importCollection(
	username: string,
	onProgress: (progress: ImportProgress) => void
): Promise<LocalGame[]> {
	onProgress({ status: 'loading', message: `Fetching ${username}'s collection from BGG...`, total: 0, imported: 0 });

	let xml: string | null = null;
	let retries = 0;
	const maxRetries = 8;

	// BGG returns 202 the first time — we have to keep asking
	while (retries < maxRetries) {
		const response = await fetch(`/api/bgg?type=collection&username=${encodeURIComponent(username)}`);

		if (response.status === 202) {
			retries++;
			onProgress({
				status: 'queued',
				message: `BGG is preparing the collection... (attempt ${retries}/${maxRetries})`,
				total: 0,
				imported: 0
			});
			// Wait longer between each retry
			await new Promise((r) => setTimeout(r, 3000 + retries * 1000));
			continue;
		}

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(errorData?.error || `BGG returned status ${response.status}`);
		}

		xml = await response.text();
		break;
	}

	if (!xml) {
		throw new Error('BGG took too long to prepare the collection. Please try again.');
	}

	// Parse the XML
	onProgress({ status: 'parsing', message: 'Parsing your games...', total: 0, imported: 0 });

	const parsed = parser.parse(xml);
	const items = parsed?.items?.item;

	if (!items || !Array.isArray(items)) {
		// Could be empty collection or invalid username
		if (parsed?.errors?.error?.message) {
			throw new Error(parsed.errors.error.message);
		}
		return [];
	}

	const total = items.length;
	onProgress({ status: 'parsing', message: `Found ${total} games! Converting...`, total, imported: 0 });

	// Convert BGG XML items to our LocalGame format
	const games: LocalGame[] = [];
	for (let i = 0; i < items.length; i++) {
		try {
			const game = parseCollectionItem(items[i]);
			if (game) {
				games.push(game);
				if (i % 10 === 0) {
					onProgress({ status: 'parsing', message: `Processing games...`, total, imported: i + 1 });
				}
			}
		} catch (e) {
			console.warn('Failed to parse game:', items[i], e);
		}
	}

	onProgress({ status: 'done', message: `Successfully imported ${games.length} games!`, total, imported: games.length });

	return games;
}

/**
 * Parse a single collection item from BGG XML into a LocalGame
 */
function parseCollectionItem(item: any): LocalGame | null {
	const bggId = parseInt(item['@_objectid']);
	if (!bggId || isNaN(bggId)) return null;

	// Name can be a string or object
	const name = typeof item.name === 'string'
		? item.name
		: item.name?.[0]?.['#text'] || item.name?.['#text'] || 'Unknown Game';

	const stats = item.stats;

	return {
		bggId,
		name,
		yearPublished: safeInt(item.yearpublished),
		minPlayers: safeInt(stats?.['@_minplayers']),
		maxPlayers: safeInt(stats?.['@_maxplayers']),
		playingTime: safeInt(stats?.['@_playingtime']),
		minPlaytime: safeInt(stats?.['@_minplaytime']),
		maxPlaytime: safeInt(stats?.['@_maxplaytime']),
		thumbnailUrl: item.thumbnail || undefined,
		imageUrl: item.image || undefined,
		categories: [],
		mechanics: [],
		bggRating: safeFloat(stats?.rating?.average?.['@_value']),
		bggWeight: undefined
	};
}

// ============================================
// Game Search
// ============================================

export interface SearchResult {
	bggId: number;
	name: string;
	yearPublished?: number;
}

/**
 * Search BGG for games by name
 */
export async function searchGames(query: string): Promise<SearchResult[]> {
	if (!query.trim()) return [];

	const response = await fetch(`/api/bgg?type=search&query=${encodeURIComponent(query)}`);
	if (!response.ok) throw new Error('Search failed');

	const xml = await response.text();
	const parsed = parser.parse(xml);
	const items = parsed?.items?.item;

	if (!items || !Array.isArray(items)) return [];

	return items
		.map((item: any) => {
			const bggId = parseInt(item['@_id']);
			// Name can be array or single object
			const nameObj = Array.isArray(item.name) ? item.name[0] : item.name;
			const name = nameObj?.['@_value'] || 'Unknown';
			const year = safeInt(item.yearpublished?.['@_value']);

			return { bggId, name, yearPublished: year };
		})
		.filter((r: SearchResult) => r.bggId && r.name !== 'Unknown')
		.slice(0, 25); // Limit results
}

/**
 * Get full details for a game by BGG ID
 */
export async function getGameDetails(bggId: number): Promise<LocalGame | null> {
	const response = await fetch(`/api/bgg?type=thing&id=${bggId}`);
	if (!response.ok) throw new Error('Failed to fetch game details');

	const xml = await response.text();
	const parsed = parser.parse(xml);
	const item = parsed?.items?.item?.[0];

	if (!item) return null;

	// Extract primary name
	const names = Array.isArray(item.name) ? item.name : [item.name];
	const primaryName = names.find((n: any) => n['@_type'] === 'primary');
	const name = primaryName?.['@_value'] || names[0]?.['@_value'] || 'Unknown';

	// Extract categories and mechanics from links
	const links = item.link || [];
	const categories = links
		.filter((l: any) => l['@_type'] === 'boardgamecategory')
		.map((l: any) => l['@_value']);
	const mechanics = links
		.filter((l: any) => l['@_type'] === 'boardgamemechanic')
		.map((l: any) => l['@_value']);

	const stats = item.statistics?.ratings;

	return {
		bggId: parseInt(item['@_id']),
		name,
		yearPublished: safeInt(item.yearpublished?.['@_value']),
		minPlayers: safeInt(item.minplayers?.['@_value']),
		maxPlayers: safeInt(item.maxplayers?.['@_value']),
		playingTime: safeInt(item.playingtime?.['@_value']),
		minPlaytime: safeInt(item.minplaytime?.['@_value']),
		maxPlaytime: safeInt(item.maxplaytime?.['@_value']),
		minAge: safeInt(item.minage?.['@_value']),
		description: item.description ? stripHtml(item.description) : undefined,
		thumbnailUrl: item.thumbnail || undefined,
		imageUrl: item.image || undefined,
		categories,
		mechanics,
		bggRating: safeFloat(stats?.average?.['@_value']),
		bggWeight: safeFloat(stats?.averageweight?.['@_value'])
	};
}

// ============================================
// Helpers
// ============================================

function safeInt(val: any): number | undefined {
	if (val === undefined || val === null || val === '') return undefined;
	const num = parseInt(String(val));
	return isNaN(num) ? undefined : num;
}

function safeFloat(val: any): number | undefined {
	if (val === undefined || val === null || val === '') return undefined;
	const num = parseFloat(String(val));
	return isNaN(num) ? undefined : num;
}

function stripHtml(html: string): string {
	return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#10;/g, '\n').trim();
}
