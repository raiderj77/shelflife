import type { RequestHandler } from './$types';

const SITE_URL = 'https://shelflife-five.vercel.app';

const publicRoutes = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/login', priority: '0.6', changefreq: 'monthly' }
];

export const GET: RequestHandler = async () => {
	const lastmod = new Date().toISOString().split('T')[0];

	const urls = publicRoutes
		.map(
			(route) => `
  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
		)
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

	return new Response(xml.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
