import { getCollection } from 'astro:content';

export async function GET() {
  const baseUrl = 'https://highintheflightsimsky.nl';
  
  // Static pages
  const pages = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/videos/', changefreq: 'daily', priority: '0.9' },
    { loc: '/posts/', changefreq: 'daily', priority: '0.9' },
    { loc: '/feed/', changefreq: 'hourly', priority: '0.7' },
    { loc: '/privacy/', changefreq: 'monthly', priority: '0.5' },
    { loc: '/terms/', changefreq: 'monthly', priority: '0.5' },
  ];
  
  // Dynamic post pages
  const posts = await getCollection('posts');
  const postPages = posts
    .filter((post) => !post.data.draft)
    .map((post) => ({
      loc: `/posts/${post.slug}/`,
      changefreq: 'monthly',
      priority: '0.7',
    }));
  
  const allPages = [...pages, ...postPages];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
  `
    )
    .join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
