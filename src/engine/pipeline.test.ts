import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runSync } from './pipeline.js';

const TEST_DIR = path.join(import.meta.dirname, '../../.test-pipeline');

beforeEach(() => {
	fs.mkdirSync(path.join(TEST_DIR, 'transformers'), { recursive: true });
});

afterEach(() => {
	if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
});

describe('runSync', () => {
	it('copies file when no transformer (passthrough)', async () => {
		const source = path.join(TEST_DIR, 'source.ts');
		const target = path.join(TEST_DIR, 'target.ts');
		fs.writeFileSync(source, 'export const x = 1;');

		const result = await runSync(
			{
				id: 'copy-test',
				source: './source.ts',
				target: './target.ts',
			},
			TEST_DIR,
		);

		expect(result.status).toBe('synced');
		expect(fs.readFileSync(target, 'utf-8')).toBe('export const x = 1;');
	});

	it('applies a single transformer', async () => {
		const source = path.join(TEST_DIR, 'source.ts');
		const target = path.join(TEST_DIR, 'target.ts');
		const transformer = path.join(TEST_DIR, 'transformers', 'upper.ts');

		fs.writeFileSync(source, 'hello');
		fs.writeFileSync(
			transformer,
			`const t = (s: string) => s.toUpperCase();
export default t;`,
		);

		const result = await runSync(
			{
				id: 'upper-test',
				source: './source.ts',
				target: './target.ts',
				transformer: './transformers/upper.ts',
			},
			TEST_DIR,
		);

		expect(result.status).toBe('synced');
		expect(fs.readFileSync(target, 'utf-8')).toBe('HELLO');
	});

	it('chains multiple transformers', async () => {
		const source = path.join(TEST_DIR, 'source.ts');
		const target = path.join(TEST_DIR, 'target.ts');
		const t1 = path.join(TEST_DIR, 'transformers', 'upper.ts');
		const t2 = path.join(TEST_DIR, 'transformers', 'wrap.ts');

		fs.writeFileSync(source, 'hello');
		fs.writeFileSync(
			t1,
			`const t = (s: string) => s.toUpperCase();
export default t;`,
		);
		fs.writeFileSync(
			t2,
			`const t = (s: string) => \`[\${s}]\`;
export default t;`,
		);

		const result = await runSync(
			{
				id: 'chain-test',
				source: './source.ts',
				target: './target.ts',
				transformer: ['./transformers/upper.ts', './transformers/wrap.ts'],
			},
			TEST_DIR,
		);

		expect(result.status).toBe('synced');
		expect(fs.readFileSync(target, 'utf-8')).toBe('[HELLO]');
	});

	it('returns diff and does not write when dry-run is true', async () => {
		const source = path.join(TEST_DIR, 'source.ts');
		const target = path.join(TEST_DIR, 'target.ts');
		fs.writeFileSync(source, 'new content');
		fs.writeFileSync(target, 'old content');

		const result = await runSync(
			{
				id: 'dry-test',
				source: './source.ts',
				target: './target.ts',
			},
			TEST_DIR,
			{ dryRun: true },
		);

		expect(result.status).toBe('synced');
		expect(result.diff).toBeDefined();
		expect(result.diff).toContain('-old content');
		expect(result.diff).toContain('+new content');
		// Target should not have been overwritten
		expect(fs.readFileSync(target, 'utf-8')).toBe('old content');
	});

	it('dry-run works when target does not exist', async () => {
		const source = path.join(TEST_DIR, 'source.ts');
		fs.writeFileSync(source, 'new content');

		const result = await runSync(
			{
				id: 'dry-no-target',
				source: './source.ts',
				target: './target.ts',
			},
			TEST_DIR,
			{ dryRun: true },
		);

		expect(result.status).toBe('synced');
		expect(result.diff).toBeDefined();
		expect(result.diff).toContain('+new content');
		expect(fs.existsSync(path.join(TEST_DIR, 'target.ts'))).toBe(false);
	});

	it('writes error marker on transformer failure', async () => {
		const source = path.join(TEST_DIR, 'source.ts');
		const target = path.join(TEST_DIR, 'target.ts');
		const transformer = path.join(TEST_DIR, 'transformers', 'bad.ts');

		fs.writeFileSync(source, 'data');
		fs.writeFileSync(target, 'previous content');
		fs.writeFileSync(
			transformer,
			`const t = () => { throw new Error('boom'); };
export default t;`,
		);

		const result = await runSync(
			{
				id: 'fail-test',
				source: './source.ts',
				target: './target.ts',
				transformer: './transformers/bad.ts',
			},
			TEST_DIR,
		);

		expect(result.status).toBe('error');
		expect(result.error).toContain('boom');

		const markerPath = path.join(TEST_DIR, '.mesh-sync-errors', 'target.ts');
		const markerContent = fs.readFileSync(markerPath, 'utf-8');
		expect(markerContent).toContain('MESH-SYNC SYNC FAILED');
		expect(markerContent).toContain('previous content');
	});
});
