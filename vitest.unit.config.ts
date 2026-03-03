import { readFileSync } from 'node:fs';
import * as esbuild from 'esbuild';
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
	define: {
		__CLI_VERSION__: JSON.stringify('0.0.0-test'),
	},
	test: {
		name: { label: 'unit', color: 'green' },
		environment: 'node',
		globals: true,
		typecheck: {
			tsconfig: './tsconfig.vitest.json',
		},
		include: ['**/*.test.ts'],
		exclude: ['node_modules', '**/*.test.tsx', '**/*.test-d.ts', 'e2e/**'],
		sequence: {
			groupOrder: 1,
		},
	},
});
