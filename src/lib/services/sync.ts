import { supabase } from '$lib/services/supabase';
import { db, type LocalGame, type LocalCollectionGame, type LocalPlay } from '$lib/db/schema';

/**
 * ShelfLife — Two-Way Sync Engine
 *
 * Handles syncing between Dexie (local IndexedDB) and Supabase (cloud).
 * Strategy: Push local pending changes first, then pull remote changes.
 * Conflict resolution: Last-Write-Wins by updatedAt timestamp.
 */

// ============================================
// ID Mapping: bggId <-> Supabase games.id
// ============================================

/** Cache of bggId -> Supabase game ID to avoid repeated lookups */
const gameIdCache = new Map<number, number>();

/**
 * Ensure a game exists in Supabase and return its remote games.id.
 * Uses bgg_id as the unique key. Inserts if not found.
 */
async function ensureRemoteGame(localGame: LocalGame): Promise<number> {
	// Check cache first
	const cached = gameIdCache.get(localGame.bggId);
	if (cached) return cached;

	// Try to find by bgg_id
	const { data: existing } = await supabase
		.from('games')
		.select('id')
		.eq('bgg_id', localGame.bggId)
		.maybeSingle();

	if (existing) {
		gameIdCache.set(localGame.bggId, existing.id);
		return existing.id;
	}

	// Insert new game
	const { data: inserted, error } = await supabase
		.from('games')
		.insert({
			bgg_id: localGame.bggId,
			name: localGame.name,
			year_published: localGame.yearPublished ?? null,
			min_players: localGame.minPlayers ?? null,
			max_players: localGame.maxPlayers ?? null,
			playing_time: localGame.playingTime ?? null,
			min_playtime: localGame.minPlaytime ?? null,
			max_playtime: localGame.maxPlaytime ?? null,
			min_age: localGame.minAge ?? null,
			description: localGame.description ?? null,
			thumbnail_url: localGame.thumbnailUrl ?? null,
			image_url: localGame.imageUrl ?? null,
			categories: localGame.categories ?? [],
			mechanics: localGame.mechanics ?? [],
			bgg_rating: localGame.bggRating ?? null,
			bgg_weight: localGame.bggWeight ?? null
		})
		.select('id')
		.single();

	if (error) {
		// If it's a unique violation, another tab/device inserted it — fetch it
		if (error.code === '23505') {
			const { data: retry } = await supabase
				.from('games')
				.select('id')
				.eq('bgg_id', localGame.bggId)
				.single();
			if (retry) {
				gameIdCache.set(localGame.bggId, retry.id);
				return retry.id;
			}
		}
		throw error;
	}

	gameIdCache.set(localGame.bggId, inserted!.id);
	return inserted!.id;
}

/**
 * Ensure a game exists locally from remote data, return its bggId.
 */
async function ensureLocalGame(remoteGame: {
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
	categories: string[] | null;
	mechanics: string[] | null;
	bgg_rating: number | null;
	bgg_weight: number | null;
}): Promise<number> {
	const existing = await db.games.where('bggId').equals(remoteGame.bgg_id).first();
	if (!existing) {
		await db.games.add({
			bggId: remoteGame.bgg_id,
			name: remoteGame.name,
			yearPublished: remoteGame.year_published ?? undefined,
			minPlayers: remoteGame.min_players ?? undefined,
			maxPlayers: remoteGame.max_players ?? undefined,
			playingTime: remoteGame.playing_time ?? undefined,
			minPlaytime: remoteGame.min_playtime ?? undefined,
			maxPlaytime: remoteGame.max_playtime ?? undefined,
			minAge: remoteGame.min_age ?? undefined,
			description: remoteGame.description ?? undefined,
			thumbnailUrl: remoteGame.thumbnail_url ?? undefined,
			imageUrl: remoteGame.image_url ?? undefined,
			categories: remoteGame.categories ?? [],
			mechanics: remoteGame.mechanics ?? [],
			bggRating: remoteGame.bgg_rating ?? undefined,
			bggWeight: remoteGame.bgg_weight ?? undefined
		});
	}
	return remoteGame.bgg_id;
}

// ============================================
// Phase 1: Push Local Changes to Supabase
// ============================================

export async function pushPendingChanges(userId: string): Promise<void> {
	await pushCollectionChanges(userId);
	await pushPlayChanges(userId);
	await pushDeletions(userId);
}

async function pushCollectionChanges(userId: string): Promise<void> {
	const pending = await db.collection.where('syncStatus').equals('pending').toArray();

	for (const item of pending) {
		try {
			const localGame = await db.games.where('bggId').equals(item.bggId).first();
			if (!localGame) continue;

			const gameId = await ensureRemoteGame(localGame);

			const { data, error } = await supabase
				.from('collection_games')
				.upsert(
					{
						user_id: userId,
						game_id: gameId,
						status: item.status,
						personal_rating: item.personalRating ?? null,
						notes: item.notes ?? null,
						added_at: item.addedAt.toISOString(),
						updated_at: item.updatedAt.toISOString()
					},
					{ onConflict: 'user_id,game_id' }
				)
				.select('id')
				.single();

			if (error) {
				console.error('Failed to push collection item:', item.bggId, error);
				continue;
			}

			// Mark as synced and store remote ID
			await db.collection.where('bggId').equals(item.bggId).modify({
				syncStatus: 'synced',
				remoteId: data.id
			});
		} catch (err) {
			console.error('Error pushing collection item:', item.bggId, err);
		}
	}
}

async function pushPlayChanges(userId: string): Promise<void> {
	const pending = await db.plays.where('syncStatus').equals('pending').toArray();

	for (const play of pending) {
		try {
			const localGame = await db.games.where('bggId').equals(play.bggId).first();
			if (!localGame) continue;

			const gameId = await ensureRemoteGame(localGame);

			const playData = {
				user_id: userId,
				game_id: gameId,
				played_at: play.playedAt.toISOString(),
				duration_minutes: play.durationMinutes ?? null,
				players: play.players,
				notes: play.notes ?? null,
				photo_url: play.photoUrl ?? null,
				location: play.location ?? null,
				created_at: play.createdAt.toISOString(),
				updated_at: new Date().toISOString()
			};

			let remoteId: number;

			if (play.remoteId) {
				// Update existing remote play
				const { error } = await supabase
					.from('plays')
					.update(playData)
					.eq('id', play.remoteId);

				if (error) {
					console.error('Failed to update play:', play.id, error);
					continue;
				}
				remoteId = play.remoteId;
			} else {
				// Insert new play
				const { data, error } = await supabase
					.from('plays')
					.insert(playData)
					.select('id')
					.single();

				if (error) {
					console.error('Failed to push play:', play.id, error);
					continue;
				}
				remoteId = data.id;
			}

			// Mark as synced
			if (play.id) {
				await db.plays.update(play.id, {
					syncStatus: 'synced',
					remoteId
				});
			}
		} catch (err) {
			console.error('Error pushing play:', play.id, err);
		}
	}
}

async function pushDeletions(userId: string): Promise<void> {
	const deletions = await db.deletedItems.toArray();

	for (const deletion of deletions) {
		try {
			if (deletion.table === 'collection') {
				if (deletion.remoteId) {
					await supabase
						.from('collection_games')
						.update({ deleted_at: new Date().toISOString() })
						.eq('id', deletion.remoteId)
						.eq('user_id', userId);
				} else if (deletion.bggId) {
					// Find by bggId -> game_id mapping
					const { data: game } = await supabase
						.from('games')
						.select('id')
						.eq('bgg_id', deletion.bggId)
						.maybeSingle();

					if (game) {
						await supabase
							.from('collection_games')
							.update({ deleted_at: new Date().toISOString() })
							.eq('user_id', userId)
							.eq('game_id', game.id);
					}
				}
			} else if (deletion.table === 'plays') {
				if (deletion.remoteId) {
					await supabase
						.from('plays')
						.update({ deleted_at: new Date().toISOString() })
						.eq('id', deletion.remoteId)
						.eq('user_id', userId);
				}
				// If no remoteId, the play was never synced — just clean up
			}

			// Remove the deletion record
			if (deletion.id) {
				await db.deletedItems.delete(deletion.id);
			}
		} catch (err) {
			console.error('Error pushing deletion:', deletion, err);
		}
	}
}

// ============================================
// Phase 2: Pull Remote Changes to Local
// ============================================

export async function pullRemoteChanges(userId: string): Promise<void> {
	const lastSyncedAt = await getLastSyncedAt();

	await pullCollectionChanges(userId, lastSyncedAt);
	await pullPlayChanges(userId, lastSyncedAt);

	// Update last synced timestamp
	await db.settings.put({ key: 'lastSyncedAt', value: new Date().toISOString() });
}

async function getLastSyncedAt(): Promise<string | null> {
	const setting = await db.settings.get('lastSyncedAt');
	return setting ? (setting.value as string) : null;
}

async function pullCollectionChanges(userId: string, lastSyncedAt: string | null): Promise<void> {
	let query = supabase
		.from('collection_games')
		.select('*, games(*)')
		.eq('user_id', userId);

	if (lastSyncedAt) {
		query = query.gte('updated_at', lastSyncedAt);
	}

	const { data: remoteItems, error } = await query;
	if (error) {
		console.error('Failed to pull collection:', error);
		return;
	}
	if (!remoteItems) return;

	for (const remote of remoteItems) {
		try {
			const gameData = remote.games as any;
			if (!gameData) continue;

			const bggId = await ensureLocalGame(gameData);

			// If soft-deleted remotely, remove locally
			if (remote.deleted_at) {
				await db.collection.where('bggId').equals(bggId).delete();
				continue;
			}

			const localItem = await db.collection.where('bggId').equals(bggId).first();

			if (!localItem) {
				// New item from remote — create locally
				await db.collection.add({
					bggId,
					status: remote.status as LocalCollectionGame['status'],
					personalRating: remote.personal_rating ?? undefined,
					notes: remote.notes ?? undefined,
					addedAt: new Date(remote.added_at),
					updatedAt: new Date(remote.updated_at),
					syncStatus: 'synced',
					remoteId: remote.id
				});
			} else if (localItem.syncStatus === 'synced') {
				// Local is synced, overwrite with remote (remote is authoritative after push)
				await db.collection.where('bggId').equals(bggId).modify({
					status: remote.status as LocalCollectionGame['status'],
					personalRating: remote.personal_rating ?? undefined,
					notes: remote.notes ?? undefined,
					updatedAt: new Date(remote.updated_at),
					syncStatus: 'synced',
					remoteId: remote.id
				});
			} else if (localItem.syncStatus === 'pending') {
				// Conflict: compare timestamps, most recent wins
				const remoteTime = new Date(remote.updated_at).getTime();
				const localTime = localItem.updatedAt.getTime();

				if (remoteTime > localTime) {
					// Remote wins
					await db.collection.where('bggId').equals(bggId).modify({
						status: remote.status as LocalCollectionGame['status'],
						personalRating: remote.personal_rating ?? undefined,
						notes: remote.notes ?? undefined,
						updatedAt: new Date(remote.updated_at),
						syncStatus: 'synced',
						remoteId: remote.id
					});
				}
				// If local is newer, leave it as pending for next push cycle
			}
		} catch (err) {
			console.error('Error processing remote collection item:', remote.id, err);
		}
	}
}

async function pullPlayChanges(userId: string, lastSyncedAt: string | null): Promise<void> {
	let query = supabase
		.from('plays')
		.select('*, games(*)')
		.eq('user_id', userId);

	if (lastSyncedAt) {
		query = query.gte('updated_at', lastSyncedAt);
	}

	const { data: remotePlays, error } = await query;
	if (error) {
		console.error('Failed to pull plays:', error);
		return;
	}
	if (!remotePlays) return;

	for (const remote of remotePlays) {
		try {
			const gameData = remote.games as any;
			if (!gameData) continue;

			const bggId = await ensureLocalGame(gameData);

			// If soft-deleted remotely, remove locally
			if (remote.deleted_at) {
				// Find by remoteId and delete
				const localPlay = await db.plays.where('remoteId').equals(remote.id).first();
				if (localPlay?.id) {
					await db.plays.delete(localPlay.id);
				}
				continue;
			}

			// Try to find local play by remoteId first
			let localPlay: LocalPlay | undefined;
			localPlay = await db.plays.where('remoteId').equals(remote.id).first();

			if (!localPlay) {
				// New play from remote — create locally
				await db.plays.add({
					bggId,
					playedAt: new Date(remote.played_at),
					durationMinutes: remote.duration_minutes ?? undefined,
					players: (remote.players as LocalPlay['players']) ?? [],
					notes: remote.notes ?? undefined,
					photoUrl: remote.photo_url ?? undefined,
					location: remote.location ?? undefined,
					createdAt: new Date(remote.created_at),
					syncStatus: 'synced',
					remoteId: remote.id
				});
			} else if (localPlay.syncStatus === 'synced') {
				// Overwrite with remote
				if (localPlay.id) {
					await db.plays.update(localPlay.id, {
						playedAt: new Date(remote.played_at),
						durationMinutes: remote.duration_minutes ?? undefined,
						players: (remote.players as LocalPlay['players']) ?? [],
						notes: remote.notes ?? undefined,
						syncStatus: 'synced'
					});
				}
			}
			// If pending, leave local version (will be pushed next cycle)
		} catch (err) {
			console.error('Error processing remote play:', remote.id, err);
		}
	}
}
