import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import transform from './truncate.js';

describe('truncate transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };
	let originalEnv: string | undefined;

	beforeEach(() => {
		originalEnv = process.env.MESH_SYNC_LINES;
	});

	afterEach(() => {
		if (originalEnv === undefined) {
			delete process.env.MESH_SYNC_LINES;
		} else {
			process.env.MESH_SYNC_LINES = originalEnv;
		}
	});

	it('returns source unchanged when under default limit', async () => {
		const input = 'line1\nline2\nline3';
		const result = await transform(input, ctx);
		expect(result).toBe('line1\nline2\nline3');
	});

	it('truncates to default 50 lines and appends marker', async () => {
		const lines = Array.from({ length: 60 }, (_, i) => `line${i + 1}`);
		const input = lines.join('\n');
		const result = await transform(input, ctx);
		const outputLines = result.split('\n');
		expect(outputLines).toHaveLength(51);
		expect(outputLines[0]).toBe('line1');
		expect(outputLines[49]).toBe('line50');
		expect(outputLines[50]).toBe('// ... truncated');
	});

	it('respects MESH_SYNC_LINES env var', async () => {
		process.env.MESH_SYNC_LINES = '3';
		const input = 'a\nb\nc\nd\ne';
		const result = await transform(input, ctx);
		expect(result).toBe('a\nb\nc\n// ... truncated');
	});

	it('does not append marker when exactly at limit', async () => {
		process.env.MESH_SYNC_LINES = '3';
		const input = 'a\nb\nc';
		const result = await transform(input, ctx);
		expect(result).toBe('a\nb\nc');
	});

	it('handles single-line input', async () => {
		process.env.MESH_SYNC_LINES = '5';
		const input = 'only one line';
		const result = await transform(input, ctx);
		expect(result).toBe('only one line');
	});
});
