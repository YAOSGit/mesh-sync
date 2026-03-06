import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import transform from './json-merge.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('json-merge transformer', () => {
	const originalEnv = process.env.MESH_SYNC_MERGE_BASE;

	beforeEach(() => {
		delete process.env.MESH_SYNC_MERGE_BASE;
	});

	afterEach(() => {
		if (originalEnv !== undefined) {
			process.env.MESH_SYNC_MERGE_BASE = originalEnv;
		} else {
			delete process.env.MESH_SYNC_MERGE_BASE;
		}
	});

	it('returns source unchanged when env var is not set', () => {
		const input = JSON.stringify({ a: 1 });
		const result = transform(input, ctx);
		expect(result).toBe(input);
	});

	it('deep-merges source over base for scalar values', () => {
		process.env.MESH_SYNC_MERGE_BASE = JSON.stringify({ a: 1, b: 2 });
		const input = JSON.stringify({ b: 99, c: 3 });
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({ a: 1, b: 99, c: 3 });
	});

	it('recursively merges nested objects', () => {
		process.env.MESH_SYNC_MERGE_BASE = JSON.stringify({
			config: { host: 'localhost', port: 3000 },
		});
		const input = JSON.stringify({ config: { port: 8080, debug: true } });
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({
			config: { host: 'localhost', port: 8080, debug: true },
		});
	});

	it('concatenates arrays', () => {
		process.env.MESH_SYNC_MERGE_BASE = JSON.stringify({ tags: ['a', 'b'] });
		const input = JSON.stringify({ tags: ['c'] });
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({ tags: ['a', 'b', 'c'] });
	});

	it('outputs with tab indent and trailing newline', () => {
		process.env.MESH_SYNC_MERGE_BASE = JSON.stringify({ x: 1 });
		const input = JSON.stringify({ y: 2 });
		const result = transform(input, ctx);
		expect(result).toBe('{\n\t"x": 1,\n\t"y": 2\n}\n');
	});
});
