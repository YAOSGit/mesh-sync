import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import transform from './json-omit.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('json-omit transformer', () => {
	const originalEnv = process.env.MESH_SYNC_OMIT;

	beforeEach(() => {
		delete process.env.MESH_SYNC_OMIT;
	});

	afterEach(() => {
		if (originalEnv !== undefined) {
			process.env.MESH_SYNC_OMIT = originalEnv;
		} else {
			delete process.env.MESH_SYNC_OMIT;
		}
	});

	it('removes specified keys from JSON', () => {
		process.env.MESH_SYNC_OMIT = 'private,devDependencies';
		const input = JSON.stringify({
			name: 'app',
			private: true,
			devDependencies: {},
		});
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({ name: 'app' });
	});

	it('returns source unchanged when env var is not set', () => {
		const input = JSON.stringify({ a: 1, b: 2 });
		const result = transform(input, ctx);
		expect(result).toBe(input);
	});

	it('handles keys that do not exist in source', () => {
		process.env.MESH_SYNC_OMIT = 'missing,absent';
		const input = JSON.stringify({ name: 'app', version: '1.0' });
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({
			name: 'app',
			version: '1.0',
		});
	});

	it('outputs with tab indent and trailing newline', () => {
		process.env.MESH_SYNC_OMIT = 'b';
		const input = JSON.stringify({ a: 1, b: 2 });
		const result = transform(input, ctx);
		expect(result).toBe('{\n\t"a": 1\n}\n');
	});

	it('handles spaces in comma-separated keys', () => {
		process.env.MESH_SYNC_OMIT = ' x , y ';
		const input = JSON.stringify({ x: 1, y: 2, z: 3 });
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({ z: 3 });
	});
});
