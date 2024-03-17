import {HeadConfig, defineConfig} from 'vitepress';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mainContract = 'BomberWoman';

const contractFilenames = fs.readdirSync(path.join(__dirname, '../contracts'));
const contractNames = contractFilenames.map((filename) => path.basename(filename, '.md'));
const firstContractName = contractNames.indexOf(mainContract) == -1 ? contractNames[0] : mainContract;

const contracts = contractNames
	.sort((a, b) => (a === firstContractName ? -1 : b === firstContractName ? 1 : a > b ? 1 : a < b ? -1 : 0))
	.map((name) => {
		return {
			text: name,
			link: `/contracts/${name}/`,
		};
	});

const isRunningOnVercel = !!process.env.VERCEL;

const description = 'Bomber Woman is a fun simultaneous turn based game where player attempt to bomb each other';
const title = 'Bomber Woman';
const host = `https://wighawag.github.io/bomber-woman/`;
const preview = `${host}/preview.png`;

// https://vitepress.dev/reference/site-config
export default defineConfig({
	base: isRunningOnVercel ? '/' : '/bomber-woman/',
	title,
	description,
	head: [
		[
			'script',
			{id: 'plausible'},
			`;(() => {
        if (location.hostname === '${host}') {
          const plausible_script = document.createElement('script');
          plausible_script.setAttribute('data-domain','${host}');
          plausible_script.setAttribute('data-api','/stats/api/event');
          plausible_script.setAttribute('src','/stats/js/script.js');
          document.head.appendChild(plausible_script);
        }
        })()`,
		],
		// [
		// 	'script',
		// 	{
		// 		defer: '',
		// 		'data-domain': 'bomber-woman.world',
		// 		src: '/stats/js/script.js',
		// 		'data-api': '/stats/api/event',
		// 	},
		// ],
		['link', {rel: 'icon', href: '/icon.png'}],
		['meta', {name: 'theme-color', content: '#9F5FED'}],

		['meta', {name: 'og:url', content: host}],
		['meta', {name: 'og:title', content: title}],
		['meta', {name: 'og:description', content: description}],
		['meta', {name: 'og:type', content: 'website'}],
		['meta', {name: 'og:locale', content: 'en'}],
		['meta', {name: 'og:site_name', content: title}],
		['meta', {name: 'og:image', content: preview}],

		['meta', {name: 'twitter:url', content: host}],
		['meta', {name: 'twitter:title', content: title}],
		['meta', {name: 'twitter:description', content: description}],
		['meta', {name: 'twitter:card', content: 'summary_large_image'}],
		['meta', {name: 'twitter:image', content: preview}],
	],
	themeConfig: {
		logo: '/logo.png',
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{text: 'Home', link: '/'},
			{text: 'Getting Started', link: '/guide/getting-started/'},
			{text: 'Contracts', link: `/contracts/${firstContractName}/`},
		],

		sidebar: [
			{
				text: 'Documentation',
				items: [
					{text: 'Getting Started', link: '/guide/getting-started/'},
					{text: 'Contracts', items: contracts},
				],
			},
		],

		socialLinks: [
			{icon: 'github', link: 'https://github.com/wighawag/bomber-woman#readme'},
			{icon: 'twitter', link: 'https://twitter.com/wighawag'},
			{icon: 'discord', link: 'https://discord.gg/Qb4gr2ekfr'},
		],

		search: {
			provider: 'local',
		},

		footer: {
			message: 'Released under the GPL 3.0 License.',
			copyright: 'Copyright © 2022-present Ronan Sandford',
		},
	},
	appearance: 'force-dark',
	rewrites: {
		'contracts/:pkg.md': 'contracts/:pkg/index.md',
	},
	transformHead: ({pageData}) => {
		const head: HeadConfig[] = [];

		if (pageData.frontmatter.title) {
			head.push(['title', {}, pageData.frontmatter.title]);
			head.push(['meta', {name: 'og:title', content: pageData.frontmatter.title}]);
			head.push(['meta', {name: 'twitter:title', content: pageData.frontmatter.title}]);
		}

		if (pageData.frontmatter.description) {
			head.push(['meta', {name: 'description', content: pageData.frontmatter.description}]);
			head.push(['meta', {name: 'og:description', content: pageData.frontmatter.description}]);
			head.push(['meta', {name: 'twitter:description', content: pageData.frontmatter.description}]);
		}

		if (pageData.frontmatter.image) {
			head.push(['meta', {name: 'og:image', content: `${host}${pageData.frontmatter.image}`}]);
			head.push(['meta', {name: 'twitter:image', content: `${host}${pageData.frontmatter.image}`}]);
			head.push(['meta', {name: 'twitter:card', content: 'summary_large_image'}]);
		}

		const filepath = '/' + pageData.filePath;
		const base = path.basename(filepath);
		const dir = path.dirname(filepath);

		let pathname;
		if (base == 'index.md') {
			if (dir === '.' || dir === '/') {
				pathname = '/';
			} else {
				pathname = dir + '/';
			}
		} else {
			const baseWithoutExtension = path.basename(filepath, '.md');
			pathname = dir + '/' + baseWithoutExtension + '/';
		}

		head.push(['link', {rel: '“canonical”', href: `${host}${pathname}`}]);
	},
});
