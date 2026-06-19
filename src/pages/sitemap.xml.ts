import { getCollection } from 'astro:content';

export async function GET() {
  const baseUrl = 'https://highintheflightsimsky.nl';

  const videos = await getCollection('videos');
  const posts = await getCollection('posts');
  const playlists = await getCollection('playlists');
  const tracks = await getCollection('tracks');

  const staticPages = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/videos/', changefreq: 'daily', priority: '0.9' },
    { loc: '/playlists/', changefreq: 'daily', priority: '0.85' },
    { loc: '/tracks/', changefreq: 'weekly', priority: '0.8' },
    { loc: '/posts/', changefreq: 'daily', priority: '0.85' },
    { loc: '/controllers/', changefreq: 'weekly', priority: '0.85' },
    { loc: '/feed/', changefreq: 'hourly', priority: '0.7' },
    { loc: '/privacy/', changefreq: 'monthly', priority: '0.4' },
    { loc: '/terms/', changefreq: 'monthly', priority: '0.4' },
  ];

  const videoPages = videos.map((video) => ({
    loc: `/videos/${video.id}/`,
    changefreq: 'weekly',
    priority: '0.75',
  }));

  const pageSize = 9;
  const totalVideoPages = Math.ceil(videos.length / pageSize);
  const videoPaginationPages = Array.from({ length: Math.max(0, totalVideoPages - 1) }, (_, i) => i + 2).map((page) => ({
    loc: `/videos/page/${page}/`,
    changefreq: 'daily',
    priority: '0.6',
  }));

  const postPages = posts
    .filter((post) => !post.data.draft)
    .map((post) => ({
      loc: `/posts/${post.id.replace(/\.mdx?$/, '')}/`,
      changefreq: 'monthly',
      priority: '0.7',
    }));

  const playlistPages = playlists.map((playlist) => ({
    loc: `/playlists/${playlist.data.slug}/`,
    changefreq: 'weekly',
    priority: '0.7',
  }));

  const trackPages = tracks.map((track) => ({
    loc: `/tracks/${track.data.slug}/`,
    changefreq: 'weekly',
    priority: '0.7',
  }));

  const allPages = [
    ...staticPages,
    ...videoPages,
    ...videoPaginationPages,
    ...postPages,
    ...playlistPages,
    ...trackPages,
  ];
  
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
