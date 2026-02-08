import Dexie, { type Table } from 'dexie';

export interface CollectionGame {
	id?: number;
	bggId?: number;
	name: string;
	yearPublished?: number;
	thumbnail?: string;
	image?: string;
	minPlayers?: number;
	maxPlayers?: number;
	playingTime?: number;
	minPlaytime?: number;
	maxPlaytime?: number;
	description?: string;
	rating?: number;
	weight?: number;
	owned?: boolean;
	dateAdded?: string;
}

export interface Play {
	id?: number;
	gameId: number;
	gameName: string;
	datePlayed: string;
	players?: string[];
	winner?: string;
	notes?: string;
	photo?: string;
	createdAt: string;
}

export interface UserSettings {
	id?: number;
	theme?: 'light' | 'dark' | 'system';
	defaultView?: 'grid' | 'list';
	bggUsername?: string;
}

class ShelfLifeDatabase extends Dexie {
	collection!: Table<CollectionGame>;
	plays!: Table<Play>;
	settings!: Table<UserSettings>;

	constructor() {
		super('ShelfLife_v3');
		this.version(1).stores({
			collection: '++id, bggId, name, yearPublished, owned',
			plays: '++id, gameId, datePlayed, createdAt',
			settings: '++id'
		});
	}
}

export const db = new ShelfLifeDatabase();
