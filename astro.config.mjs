// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import rehypeSanitize from 'rehype-sanitize';

// https://astro.build/config
export default defineConfig({
	site: 'https://highintheflightsimsky.nl',
	output: 'static',
	markdown: {
		processor: unified({ rehypePlugins: [rehypeSanitize] }),
	},
	vite: {
		plugins: [tailwindcss()],
		ssr: {
			external: ['svgo'],
		},
	},
});
