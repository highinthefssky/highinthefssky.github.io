export async function GET() {
  const baseUrl = 'https://highinthefssky.github.io';
  
  const pages = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/videos/', changefreq: 'daily', priority: '0.9' },
    { loc: '/search/', changefreq: 'daily', priority: '0.8' },
    { loc: '/posts/', changefreq: 'daily', priority: '0.9' },
    { loc: '/feed/', changefreq: 'hourly', priority: '0.7' },
  ];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
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
