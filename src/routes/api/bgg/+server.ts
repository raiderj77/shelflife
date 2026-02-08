import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, fetch }) => {
	const type = url.searchParams.get('type');
	const query = url.searchParams.get('query');
	const username = url.searchParams.get('username');

	if (!type) {
		throw error(400, 'Missing type parameter');
	}

	let bggUrl = 'https://boardgamegeek.com/xmlapi2/';

	if (type === 'collection' && username) {
		bggUrl += `collection?username=${encodeURIComponent(username)}&stats=1`;
	} else if (type === 'search' && query) {
		bggUrl += `search?query=${encodeURIComponent(query)}&type=boardgame`;
	} else if (type === 'thing' && query) {
		bggUrl += `thing?id=${query}&stats=1`;
	} else {
		throw error(400, 'Invalid parameters');
	}

	try {
		const response = await fetch(bggUrl);
		const text = await response.text();
		
		return new Response(text, {
			headers: {
				'Content-Type': 'application/xml'
			}
		});
	} catch (err) {
		console.error('BGG API error:', err);
		throw error(503, 'BoardGameGeek API unavailable');
	}
};
