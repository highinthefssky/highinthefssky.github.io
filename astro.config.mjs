// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind()],
	site: 'https://highinthefssky.github.io',
	output: 'static',
	vite: {
		ssr: {
			external: ['svgo'],
		},
	},
});
