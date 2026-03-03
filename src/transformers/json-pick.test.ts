import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import transform from './json-pick.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('json-pick transformer', () => {
	const originalEnv = process.env.MESH_SYNC_PICK;

	beforeEach(() => {
		delete process.env.MESH_SYNC_PICK;
	});

	afterEach(() => {
		if (originalEnv !== undefined) {
			process.env.MESH_SYNC_PICK = originalEnv;
		} else {
			delete process.env.MESH_SYNC_PICK;
		}
	});

	it('picks specified keys from JSON', () => {
		process.env.MESH_SYNC_PICK = 'name,version';
		const input = JSON.stringify({
			name: 'app',
			version: '1.0',
			private: true,
		});
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({
			name: 'app',
			version: '1.0',
		});
	});

	it('returns source unchanged when env var is not set', () => {
		const input = JSON.stringify({ a: 1, b: 2 });
		const result = transform(input, ctx);
		expect(result).toBe(input);
	});

	it('ignores keys that do not exist in source', () => {
		process.env.MESH_SYNC_PICK = 'name,missing';
		const input = JSON.stringify({ name: 'app', other: 'data' });
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({ name: 'app' });
	});

	it('outputs with 2-space indent and trailing newline', () => {
		process.env.MESH_SYNC_PICK = 'a';
		const input = JSON.stringify({ a: 1, b: 2 });
		const result = transform(input, ctx);
		expect(result).toBe('{\n  "a": 1\n}\n');
	});

	it('handles spaces in comma-separated keys', () => {
		process.env.MESH_SYNC_PICK = ' name , description ';
		const input = JSON.stringify({ name: 'x', description: 'y', extra: 'z' });
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({
			name: 'x',
			description: 'y',
		});
	});
});
