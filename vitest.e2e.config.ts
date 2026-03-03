import { defineConfig } from 'vitest/config';

export default defineConfig({
	define: {
		__CLI_VERSION__: JSON.stringify('0.0.0-test'),
	},
	test: {
		name: { label: 'e2e', color: 'yellow' },
		environment: 'node',
		globals: true,
		pool: 'forks',
		maxWorkers: 1,
		isolate: false,
		testTimeout: 30_000,
		hookTimeout: 10_000,
		typecheck: {
			tsconfig: './tsconfig.vitest.json',
		},
		include: ['e2e/*.e2e.ts'],
		exclude: ['node_modules'],
		sequence: {
			groupOrder: 2,
		},
	},
});
