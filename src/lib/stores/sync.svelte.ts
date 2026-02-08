import { db } from '$lib/db/schema';
import { pushPendingChanges, pullRemoteChanges } from '$lib/services/sync';
import { liveQuery, type Subscription } from 'dexie';

/**
 * ShelfLife — Sync Store (Svelte 5 Runes)
 *
 * Reactive wrapper around the sync engine. Handles:
 * - Online/offline detection
 * - Periodic sync (every 30s)
 * - Debounced sync after mutations
 * - Status tracking for UI indicator
 */

class SyncStore {
	/** Current sync status */
	status = $state<'idle' | 'syncing' | 'error' | 'offline'>('idle');

	/** Last successful sync time */
	lastSyncedAt = $state<Date | null>(null);

	/** Number of pending items waiting to sync */
	pendingCount = $state(0);

	/** Error message if last sync failed */
	lastError = $state<string | null>(null);

	/** Whether the browser is online */
	isOnline = $state(true);

	private syncTimer: ReturnType<typeof setInterval> | null = null;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	private userId: string | null = null;
	private subscriptions: Subscription[] = [];
	private onlineHandler: (() => void) | null = null;
	private offlineHandler: (() => void) | null = null;

	/**
	 * Start the sync engine. Called once after auth is confirmed.
	 */
	initialize(userId: string) {
		// Prevent double-init
		if (this.userId === userId) return;
		this.destroy();

		this.userId = userId;
		this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

		// Listen for online/offline
		this.onlineHandler = () => {
			this.isOnline = true;
			this.sync();
		};
		this.offlineHandler = () => {
			this.isOnline = false;
			this.status = 'offline';
		};

		window.addEventListener('online', this.onlineHandler);
		window.addEventListener('offline', this.offlineHandler);

		// Initial sync
		this.sync();

		// Periodic sync every 30 seconds
		this.syncTimer = setInterval(() => {
			if (this.isOnline && this.status !== 'syncing') {
				this.sync();
			}
		}, 30_000);

		// Watch for pending changes and trigger debounced sync
		const collectionSub = liveQuery(() =>
			db.collection.where('syncStatus').equals('pending').count()
		).subscribe((count) => {
			this.pendingCount = count;
			if (count > 0 && this.isOnline) this.debouncedSync();
		});

		const playsSub = liveQuery(() =>
			db.plays.where('syncStatus').equals('pending').count()
		).subscribe((count) => {
			this.pendingCount += count;
			if (count > 0 && this.isOnline) this.debouncedSync();
		});

		const deletionsSub = liveQuery(() =>
			db.deletedItems.count()
		).subscribe((count) => {
			if (count > 0 && this.isOnline) this.debouncedSync();
		});

		this.subscriptions.push(collectionSub, playsSub, deletionsSub);

		// Load last synced time from settings
		db.settings.get('lastSyncedAt').then((setting) => {
			if (setting?.value) {
				this.lastSyncedAt = new Date(setting.value as string);
			}
		});
	}

	/**
	 * Run a full sync cycle: push then pull.
	 */
	async sync() {
		if (!this.userId || !this.isOnline) return;
		if (this.status === 'syncing') return;

		this.status = 'syncing';
		this.lastError = null;

		try {
			await pushPendingChanges(this.userId);
			await pullRemoteChanges(this.userId);
			this.lastSyncedAt = new Date();
			this.status = 'idle';
		} catch (err: any) {
			console.error('Sync failed:', err);
			this.lastError = err.message || 'Unknown sync error';
			this.status = 'error';
		}

		await this.updatePendingCount();
	}

	/**
	 * Debounced sync — waits 2s after last mutation before syncing.
	 */
	private debouncedSync() {
		if (this.debounceTimer) clearTimeout(this.debounceTimer);
		this.debounceTimer = setTimeout(() => {
			if (this.isOnline && this.status !== 'syncing') {
				this.sync();
			}
		}, 2000);
	}

	/**
	 * Count items that need syncing.
	 */
	private async updatePendingCount() {
		try {
			const collectionPending = await db.collection
				.where('syncStatus').equals('pending').count();
			const playsPending = await db.plays
				.where('syncStatus').equals('pending').count();
			const deletionsPending = await db.deletedItems.count();
			this.pendingCount = collectionPending + playsPending + deletionsPending;
		} catch {
			// Ignore errors during count
		}
	}

	/**
	 * Clean up when user logs out.
	 */
	destroy() {
		if (this.syncTimer) clearInterval(this.syncTimer);
		if (this.debounceTimer) clearTimeout(this.debounceTimer);
		this.syncTimer = null;
		this.debounceTimer = null;
		this.userId = null;
		this.status = 'idle';
		this.pendingCount = 0;
		this.lastError = null;

		// Unsubscribe from liveQuery watchers
		for (const sub of this.subscriptions) {
			sub.unsubscribe();
		}
		this.subscriptions = [];

		// Remove event listeners
		if (this.onlineHandler) {
			window.removeEventListener('online', this.onlineHandler);
			this.onlineHandler = null;
		}
		if (this.offlineHandler) {
			window.removeEventListener('offline', this.offlineHandler);
			this.offlineHandler = null;
		}
	}
}

export const syncStore = new SyncStore();
