import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in Svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter(),
		typescript: {
			config: (config) => {
				config.include.push('../drizzle.config.ts');
			}
		},
		// 	csrf: {
		// 	trustedOrigins:
		// 		process.env.NODE_ENV === 'production' ? ['https://whatsapp-rotator.vercel.app'] : ['*']
		// },
		alias: {
			'@': './src/lib',
			'@/*': './src/lib/*',
			slx: './node_modules/svelte-lexical/dist'
		}
	}
};

export default config;
