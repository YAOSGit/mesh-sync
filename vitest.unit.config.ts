import { readFileSync } from 'node:fs';
import * as esbuild from 'esbuild';
import { unitConfig } from '@yaos-git/toolkit/build';

export default unitConfig({
	plugins: [
		{
			name: 'inline-builtin-transformers',
			resolveId(id) {
				if (id.startsWith('builtin-transformer:')) return id;
			},
			async load(id) {
				if (!id.startsWith('builtin-transformer:')) return;
				const name = id.replace('builtin-transformer:', '');
				const source = readFileSync(`src/transformers/${name}.ts`, 'utf-8');
				const result = await esbuild.transform(source, {
					loader: 'ts',
					format: 'esm',
					target: 'esnext',
				});
				return `export default ${JSON.stringify(result.code)};`;
			},
		},
	],
});
