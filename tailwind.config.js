/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				primary: 'var(--color-primary)',
				secondary: 'var(--color-secondary)',
			},
			spacing: {
				'safe': 'max(1rem, env(safe-area-inset-left))',
			},
		},
	},
	plugins: [],
};
