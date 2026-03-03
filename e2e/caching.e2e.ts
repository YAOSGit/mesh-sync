import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const TEST_DIR = path.join(import.meta.dirname, '../.test-e2e-caching');
const CLI = path.join(import.meta.dirname, '../dist/cli.js');

function writeConfig(
	syncs: Array<{
		id: string;
		source: string;
		target: string;
		transformer?: string | string[];
	}>,
) {
	fs.writeFileSync(path.join(TEST_DIR, 'mesh.json'), JSON.stringify({ syncs }));
}

function runSync(args = ''): string {
	return execSync(`node ${CLI} sync ${args}`, {
		cwd: TEST_DIR,
		encoding: 'utf-8',
	});
}

function readTarget(name: string): string {
	return fs.readFileSync(path.join(TEST_DIR, name), 'utf-8');
}

beforeEach(() => {
	fs.mkdirSync(path.join(TEST_DIR, 'transformers'), { recursive: true });
});

afterEach(() => {
	if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
});

describe('caching (e2e)', () => {
	it('skips sync on hash match (second run with unchanged source)', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'content unchanged');
		writeConfig([
			{ id: 'cache-hit', source: './source.ts', target: './out.ts' },
		]);

		// First sync — writes the target and cache
		runSync();
		expect(fs.existsSync(path.join(TEST_DIR, 'out.ts'))).toBe(true);
		const cachePath = path.join(TEST_DIR, '.mesh-sync-cache.json');
		expect(fs.existsSync(cachePath)).toBe(true);

		const cacheAfterFirst = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
		const hashAfterFirst = cacheAfterFirst.entries['cache-hit']?.hash;
		expect(hashAfterFirst).toBeDefined();

		// Overwrite the target to detect if it gets re-written
		fs.writeFileSync(path.join(TEST_DIR, 'out.ts'), 'tampered');

		// Second sync — source unchanged, should skip (cache hit)
		runSync();

		// Since source hash matches cached hash, the pipeline returns early
		// without re-writing the target. The target stays "tampered".
		const targetAfterSecond = readTarget('out.ts');
		expect(targetAfterSecond).toBe('tampered');

		// Cache hash should remain the same
		const cacheAfterSecond = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
		expect(cacheAfterSecond.entries['cache-hit']?.hash).toBe(hashAfterFirst);
	});

	it('re-syncs when source changes between runs', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'original');
		writeConfig([{ id: 'resync', source: './source.ts', target: './out.ts' }]);

		runSync();
		expect(readTarget('out.ts')).toBe('original');

		// Modify the source
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'modified');
		runSync();
		expect(readTarget('out.ts')).toBe('modified');
	});

	it('--no-cache forces sync even if source is unchanged', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'force sync me');
		writeConfig([
			{ id: 'no-cache', source: './source.ts', target: './out.ts' },
		]);

		// First sync with cache
		runSync();
		expect(readTarget('out.ts')).toBe('force sync me');

		// Tamper with target
		fs.writeFileSync(path.join(TEST_DIR, 'out.ts'), 'tampered');

		// Second sync with --no-cache — should overwrite target even though source unchanged
		runSync('--no-cache');
		expect(readTarget('out.ts')).toBe('force sync me');
	});

	it('cache file is named .mesh-sync-cache.json', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'cache name test');
		writeConfig([
			{ id: 'name-check', source: './source.ts', target: './out.ts' },
		]);

		runSync();
		const cachePath = path.join(TEST_DIR, '.mesh-sync-cache.json');
		expect(fs.existsSync(cachePath)).toBe(true);
	});

	it('cache JSON has version=1, entries with hash and lastSyncedAt', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'cache structure test');
		writeConfig([
			{ id: 'structure', source: './source.ts', target: './out.ts' },
		]);

		runSync();
		const cachePath = path.join(TEST_DIR, '.mesh-sync-cache.json');
		const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));

		expect(cache.version).toBe(1);
		expect(cache.entries).toBeDefined();
		expect(cache.entries.structure).toBeDefined();
		expect(cache.entries.structure.hash).toBeDefined();
		expect(typeof cache.entries.structure.hash).toBe('string');
		expect(cache.entries.structure.lastSyncedAt).toBeDefined();
		expect(typeof cache.entries.structure.lastSyncedAt).toBe('string');
		// lastSyncedAt should be a valid ISO date
		expect(new Date(cache.entries.structure.lastSyncedAt).toISOString()).toBe(
			cache.entries.structure.lastSyncedAt,
		);
	});
});
