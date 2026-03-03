import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type CacheFile, loadCache, saveCache } from './index.js';

const TEST_DIR = path.join(import.meta.dirname, '../../../.test-cache');

beforeEach(() => {
	fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
	if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
});

describe('cache', () => {
	it('returns empty cache when file does not exist', () => {
		const cache = loadCache(TEST_DIR);
		expect(cache.version).toBe(1);
		expect(cache.entries).toEqual({});
	});

	it('round-trips save and load', () => {
		const cache: CacheFile = {
			version: 1,
			entries: {
				'my-sync': {
					hash: 'abc123',
					etag: '"etag1"',
					lastSyncedAt: '2024-01-01T00:00:00Z',
				},
			},
		};
		saveCache(TEST_DIR, cache);
		const loaded = loadCache(TEST_DIR);
		expect(loaded).toEqual(cache);
	});

	it('returns empty cache on invalid JSON', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, '.mesh-sync-cache.json'),
			'{ bad json',
		);
		const cache = loadCache(TEST_DIR);
		expect(cache.version).toBe(1);
		expect(cache.entries).toEqual({});
	});

	it('returns empty cache on wrong version', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, '.mesh-sync-cache.json'),
			JSON.stringify({ version: 99, entries: {} }),
		);
		const cache = loadCache(TEST_DIR);
		expect(cache.entries).toEqual({});
	});
});
