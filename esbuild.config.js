import { readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import * as esbuild from 'esbuild';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
const version = packageJson.version;

const requireShim = `
import { createRequire } from 'node:module';
import { fileURLToPath as __mesh_fileURLToPath } from 'node:url';
import { dirname as __mesh_dirname } from 'node:path';
const require = createRequire(import.meta.url);
const __filename = __mesh_fileURLToPath(import.meta.url);
const __dirname = __mesh_dirname(__filename);
`;

/** Pre-bundles built-in transformer .ts files into JS strings at build time. */
const inlineBuiltinTransformers = {
	name: 'inline-builtin-transformers',
	setup(build) {
		build.onResolve({ filter: /^builtin-transformer:/ }, (args) => ({
			path: args.path,
			namespace: 'builtin-transformer',
		}));
		build.onLoad(
			{ filter: /.*/, namespace: 'builtin-transformer' },
			async (args) => {
				const id = args.path.replace('builtin-transformer:', '');
				const result = await esbuild.build({
					entryPoints: [`src/transformers/${id}.ts`],
					bundle: true,
					write: false,
					format: 'esm',
					platform: 'node',
					target: 'esnext',
				});
				const code = result.outputFiles[0].text;
				return {
					contents: `export default ${JSON.stringify(code)};`,
					loader: 'js',
				};
			},
		);
	},
};

const sharedConfig = {
	bundle: true,
	platform: 'node',
	format: 'esm',
	minify: true,
	tsconfig: 'tsconfig.app.json',
	external: [...builtinModules.map((m) => `node:${m}`), 'esbuild'],
	banner: {
		js: requireShim,
	},
	define: {
		__CLI_VERSION__: JSON.stringify(version),
	},
	supported: {
		'top-level-await': true,
	},
	plugins: [
		inlineBuiltinTransformers,
		{
			name: 'node-builtins-to-node-prefix',
			setup(build) {
				const filter = new RegExp(`^(${builtinModules.join('|')})$`);
				build.onResolve({ filter }, (args) => ({
					path: `node:${args.path}`,
					external: true,
				}));
			},
		},
	],
	mainFields: ['module', 'main'],
	conditions: ['import', 'node'],
};

await esbuild.build({
	...sharedConfig,
	entryPoints: ['src/app/cli.ts'],
	outfile: 'dist/cli.js',
});
