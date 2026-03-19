import * as esbuild from 'esbuild';
import { createEsbuildConfig } from '@yaos-git/toolkit/build';

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

const config = createEsbuildConfig({
	entry: 'src/app/cli.ts',
	banner: requireShim,
	plugins: [inlineBuiltinTransformers],
});

await esbuild.build({
	...config,
	outfile: 'dist/cli.js',
	external: ['esbuild', ...config.external],
});

// Build TUI (Ink/React sync browser)
const tuiConfig = createEsbuildConfig({
	entry: 'src/app/tui.tsx',
	plugins: [inlineBuiltinTransformers],
});

await esbuild.build({
	...tuiConfig,
	outfile: 'dist/tui.js',
	external: ['esbuild', ...tuiConfig.external],
});
