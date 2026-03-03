import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import transform from './replace.js';

describe('replace transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };
	let origPattern: string | undefined;
	let origWith: string | undefined;

	beforeEach(() => {
		origPattern = process.env.MESH_SYNC_REPLACE_PATTERN;
		origWith = process.env.MESH_SYNC_REPLACE_WITH;
	});

	afterEach(() => {
		if (origPattern === undefined) {
			delete process.env.MESH_SYNC_REPLACE_PATTERN;
		} else {
			process.env.MESH_SYNC_REPLACE_PATTERN = origPattern;
		}
		if (origWith === undefined) {
			delete process.env.MESH_SYNC_REPLACE_WITH;
		} else {
			process.env.MESH_SYNC_REPLACE_WITH = origWith;
		}
	});

	it('returns source unchanged when pattern env is not set', () => {
		delete process.env.MESH_SYNC_REPLACE_PATTERN;
		const input = 'hello world';
		const result = transform(input, ctx);
		expect(result).toBe('hello world');
	});

	it('replaces all occurrences globally', () => {
		process.env.MESH_SYNC_REPLACE_PATTERN = 'foo';
		process.env.MESH_SYNC_REPLACE_WITH = 'bar';
		const input = 'foo and foo again';
		const result = transform(input, ctx);
		expect(result).toBe('bar and bar again');
	});

	it('uses empty string as default replacement', () => {
		process.env.MESH_SYNC_REPLACE_PATTERN = '\\d+';
		delete process.env.MESH_SYNC_REPLACE_WITH;
		const input = 'abc123def456';
		const result = transform(input, ctx);
		expect(result).toBe('abcdef');
	});

	it('supports regex patterns', () => {
		process.env.MESH_SYNC_REPLACE_PATTERN = '\\s+';
		process.env.MESH_SYNC_REPLACE_WITH = '-';
		const input = 'hello   world\tfoo';
		const result = transform(input, ctx);
		expect(result).toBe('hello-world-foo');
	});
});
