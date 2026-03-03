import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { executeTransformer } from './executor.js';

const TEST_DIR = path.join(import.meta.dirname, '../../.test-executor');

beforeEach(() => {
	fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
	if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
});

describe('executeTransformer', () => {
	it('runs a simple transformer', async () => {
		const transformerPath = path.join(TEST_DIR, 'upper.ts');
		fs.writeFileSync(
			transformerPath,
			`const transform = (source: string) => source.toUpperCase();
export default transform;`,
		);

		const result = await executeTransformer(transformerPath, 'hello world', {
			sourceId: 'test',
			sourcePath: './src.ts',
			targetPath: './out.ts',
		});

		expect(result).toBe('HELLO WORLD');
	});

	it('passes context to transformer', async () => {
		const transformerPath = path.join(TEST_DIR, 'ctx.ts');
		fs.writeFileSync(
			transformerPath,
			`const transform = (source: string, ctx: any) => \`\${source}|\${ctx.sourceId}\`;
export default transform;`,
		);

		const result = await executeTransformer(transformerPath, 'data', {
			sourceId: 'my-sync',
			sourcePath: './src.ts',
			targetPath: './out.ts',
		});

		expect(result).toBe('data|my-sync');
	});

	it('handles async transformers', async () => {
		const transformerPath = path.join(TEST_DIR, 'async.ts');
		fs.writeFileSync(
			transformerPath,
			`const transform = async (source: string) => {
	return source.trim();
};
export default transform;`,
		);

		const result = await executeTransformer(transformerPath, '  hello  ', {
			sourceId: 'test',
			sourcePath: './src.ts',
			targetPath: './out.ts',
		});

		expect(result).toBe('hello');
	});

	it('throws on transformer error', async () => {
		const transformerPath = path.join(TEST_DIR, 'bad.ts');
		fs.writeFileSync(
			transformerPath,
			`const transform = () => { throw new Error('broken'); };
export default transform;`,
		);

		await expect(
			executeTransformer(transformerPath, 'data', {
				sourceId: 'test',
				sourcePath: './src.ts',
				targetPath: './out.ts',
			}),
		).rejects.toThrow(/broken/);
	});

	it('times out long-running transformers', async () => {
		const transformerPath = path.join(TEST_DIR, 'slow.ts');
		fs.writeFileSync(
			transformerPath,
			`const transform = async () => {
	await new Promise(r => setTimeout(r, 60_000));
	return 'done';
};
export default transform;`,
		);

		await expect(
			executeTransformer(
				transformerPath,
				'data',
				{ sourceId: 'test', sourcePath: './src.ts', targetPath: './out.ts' },
				1_000,
			),
		).rejects.toThrow(/timed out/i);
	}, 10_000);
});
