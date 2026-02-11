const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

// Polyfill crypto for Cosmos SDK
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

let database;
let cosmosAvailable = false;

async function initializeCosmosDB() {
    if (database) return database;
    
    const endpoint = process.env.COSMOS_ENDPOINT || process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_KEY || process.env.COSMOS_DB_KEY;
    const databaseName = process.env.COSMOS_DATABASE || 'creedava';
    
    if (!endpoint || !key) {
        cosmosAvailable = false;
        return null;
    }
    
    const useEmulator = process.env.USE_COSMOS_EMULATOR === 'true';
    const connectionPolicy = useEmulator ? {
        DisableSSLVerification: true,
        enableEndpointDiscovery: false
    } : {};
    
    const client = new CosmosClient({ endpoint, key, connectionPolicy });
    database = client.database(databaseName);
    cosmosAvailable = true;
    return database;
}

/**
 * Dynamic sitemap that includes blog post URLs.
 * Serves at /api/sitemap.xml — add this URL to robots.txt or
 * use it as a secondary sitemap alongside the static one.
 *
 * Returns XML with all published blog posts so Google can discover them.
 */
app.http('getSitemap', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'sitemap.xml',
    handler: async (request, context) => {
        const baseUrl = 'https://creedava.com';
        const today = new Date().toISOString().split('T')[0];

        // Static pages
        const staticPages = [
            { loc: '/', changefreq: 'weekly', priority: '1.0' },
            { loc: '/about', changefreq: 'monthly', priority: '0.8' },
            { loc: '/services', changefreq: 'monthly', priority: '0.9' },
            { loc: '/pricing', changefreq: 'monthly', priority: '0.8' },
            { loc: '/news', changefreq: 'daily', priority: '0.7' },
            { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
        ];

        // Fetch published blog posts from Cosmos
        let blogEntries = [];
        try {
            await initializeCosmosDB();
            if (cosmosAvailable && database) {
                const container = database.container('blog');
                const { resources: posts } = await container.items.query({
                    query: 'SELECT c.slug, c.publishedAt, c.updatedAt FROM c WHERE c.type = @type AND c.status = @status AND c.isPublished = true',
                    parameters: [
                        { name: '@type', value: 'blog' },
                        { name: '@status', value: 'published' }
                    ]
                }).fetchAll();

                blogEntries = posts.map(post => ({
                    loc: `/blog/${post.slug}`,
                    lastmod: (post.updatedAt || post.publishedAt || today).split('T')[0],
                    changefreq: 'weekly',
                    priority: '0.6',
                }));
            }
        } catch (error) {
            context.warn('Could not fetch blog posts for sitemap:', error.message);
        }

        const allPages = [...staticPages, ...blogEntries];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${page.loc}?lang=en" />
    <xhtml:link rel="alternate" hreflang="es" href="${baseUrl}${page.loc}?lang=es" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${page.loc}" />
    <lastmod>${page.lastmod || today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600',
            },
            body: xml
        };
    }
});
