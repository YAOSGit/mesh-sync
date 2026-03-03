import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const TEST_DIR = path.join(import.meta.dirname, '../.test-e2e');
const CLI = path.join(import.meta.dirname, '../dist/cli.js');

beforeEach(() => {
	fs.mkdirSync(path.join(TEST_DIR, 'transformers'), { recursive: true });
});

afterEach(() => {
	if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
});

describe('mesh-sync sync (e2e)', () => {
	it('copies file with passthrough (no transformer)', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'export const x = 1;');
		fs.writeFileSync(
			path.join(TEST_DIR, 'mesh.json'),
			JSON.stringify({
				syncs: [
					{
						id: 'test',
						source: './source.ts',
						target: './out.ts',
						strategy: { manual: true },
					},
				],
			}),
		);

		execSync(`node ${CLI} sync`, { cwd: TEST_DIR });
		const output = fs.readFileSync(path.join(TEST_DIR, 'out.ts'), 'utf-8');
		expect(output).toBe('export const x = 1;');
	});

	it('applies a custom transformer', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'hello');
		fs.writeFileSync(
			path.join(TEST_DIR, 'transformers', 'upper.ts'),
			`const t = (s: string) => s.toUpperCase();
export default t;`,
		);
		fs.writeFileSync(
			path.join(TEST_DIR, 'mesh.json'),
			JSON.stringify({
				syncs: [
					{
						id: 'upper',
						source: './source.ts',
						target: './out.ts',
						transformer: './transformers/upper.ts',
						strategy: { manual: true },
					},
				],
			}),
		);

		execSync(`node ${CLI} sync`, { cwd: TEST_DIR });
		const output = fs.readFileSync(path.join(TEST_DIR, 'out.ts'), 'utf-8');
		expect(output).toBe('HELLO');
	});

	it('exits with code 0 on success', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'content');
		fs.writeFileSync(
			path.join(TEST_DIR, 'mesh.json'),
			JSON.stringify({
				syncs: [{ id: 'ok', source: './source.ts', target: './out.ts' }],
			}),
		);

		const result = execSync(`node ${CLI} sync`, { cwd: TEST_DIR });
		expect(result).toBeDefined();
	});

	it('lists sync entries', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'mesh.json'),
			JSON.stringify({
				syncs: [
					{ id: 'a', source: './a.ts', target: './b.ts' },
					{
						id: 'b',
						source: './c.ts',
						target: './d.ts',
						transformer: 'strip-comments',
					},
				],
			}),
		);

		const output = execSync(`node ${CLI} list`, {
			cwd: TEST_DIR,
			encoding: 'utf-8',
		});
		expect(output).toContain('a');
		expect(output).toContain('b');
		expect(output).toContain('strip-comments');
	});

	it('shows friendly error when config is missing', () => {
		try {
			execSync(`node ${CLI} sync`, {
				cwd: TEST_DIR,
				encoding: 'utf-8',
				stdio: 'pipe',
			});
			expect.unreachable('should have thrown');
		} catch (err: unknown) {
			const error = err as { stderr: string; status: number };
			expect(error.status).toBe(1);
			expect(error.stderr).toContain('Config file not found');
		}
	});

	it('supports --config flag to use alternate config path', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'hello');
		fs.writeFileSync(
			path.join(TEST_DIR, 'custom.json'),
			JSON.stringify({
				syncs: [
					{ id: 'custom', source: './source.ts', target: './custom-out.ts' },
				],
			}),
		);

		execSync(`node ${CLI} --config custom.json sync`, { cwd: TEST_DIR });
		const output = fs.readFileSync(
			path.join(TEST_DIR, 'custom-out.ts'),
			'utf-8',
		);
		expect(output).toBe('hello');
	});

	it('syncs multiple entries in parallel', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'a.ts'), 'aaa');
		fs.writeFileSync(path.join(TEST_DIR, 'b.ts'), 'bbb');
		fs.writeFileSync(path.join(TEST_DIR, 'c.ts'), 'ccc');
		fs.writeFileSync(
			path.join(TEST_DIR, 'mesh.json'),
			JSON.stringify({
				syncs: [
					{ id: 'x', source: './a.ts', target: './out-a.ts' },
					{ id: 'y', source: './b.ts', target: './out-b.ts' },
					{ id: 'z', source: './c.ts', target: './out-c.ts' },
				],
			}),
		);

		execSync(`node ${CLI} sync`, { cwd: TEST_DIR });
		expect(fs.readFileSync(path.join(TEST_DIR, 'out-a.ts'), 'utf-8')).toBe(
			'aaa',
		);
		expect(fs.readFileSync(path.join(TEST_DIR, 'out-b.ts'), 'utf-8')).toBe(
			'bbb',
		);
		expect(fs.readFileSync(path.join(TEST_DIR, 'out-c.ts'), 'utf-8')).toBe(
			'ccc',
		);
	});

	it('dry-run shows diff without writing', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'new content');
		fs.writeFileSync(path.join(TEST_DIR, 'existing.ts'), 'old content');
		fs.writeFileSync(
			path.join(TEST_DIR, 'mesh.json'),
			JSON.stringify({
				syncs: [{ id: 'dr', source: './source.ts', target: './existing.ts' }],
			}),
		);

		const output = execSync(`node ${CLI} sync --dry-run`, {
			cwd: TEST_DIR,
			encoding: 'utf-8',
		});
		expect(output).toContain('Diff preview');
		// Target should not be overwritten
		expect(fs.readFileSync(path.join(TEST_DIR, 'existing.ts'), 'utf-8')).toBe(
			'old content',
		);
	});

	it('creates cache file after sync', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'content');
		fs.writeFileSync(
			path.join(TEST_DIR, 'mesh.json'),
			JSON.stringify({
				syncs: [{ id: 'cached', source: './source.ts', target: './out.ts' }],
			}),
		);

		execSync(`node ${CLI} sync`, { cwd: TEST_DIR });
		const cachePath = path.join(TEST_DIR, '.mesh-sync-cache.json');
		expect(fs.existsSync(cachePath)).toBe(true);
		const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
		expect(cache.version).toBe(1);
		expect(cache.entries.cached).toBeDefined();
		expect(cache.entries.cached.hash).toBeDefined();
	});

	it('init creates mesh.json and transformers/example.ts', () => {
		execSync(`node ${CLI} init`, { cwd: TEST_DIR });
		expect(fs.existsSync(path.join(TEST_DIR, 'mesh.json'))).toBe(true);
		expect(
			fs.existsSync(path.join(TEST_DIR, 'transformers', 'example.ts')),
		).toBe(true);
		const exampleContent = fs.readFileSync(
			path.join(TEST_DIR, 'transformers', 'example.ts'),
			'utf-8',
		);
		expect(exampleContent).toContain('export default');
	});

	it('--json flag outputs structured JSON', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'content');
		fs.writeFileSync(
			path.join(TEST_DIR, 'mesh.json'),
			JSON.stringify({
				syncs: [{ id: 'json-test', source: './source.ts', target: './out.ts' }],
			}),
		);

		const output = execSync(`node ${CLI} sync --json`, {
			cwd: TEST_DIR,
			encoding: 'utf-8',
		});
		const parsed = JSON.parse(output);
		expect(parsed.results).toHaveLength(1);
		expect(parsed.results[0].id).toBe('json-test');
		expect(parsed.results[0].status).toBe('synced');
	});
});
