import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import transform from './tail.js';

describe('tail transformer', () => {
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

	it('returns last 20 lines by default', async () => {
		const lines = Array.from({ length: 30 }, (_, i) => `line${i + 1}`);
		const input = lines.join('\n');
		const result = await transform(input, ctx);
		const outputLines = result.split('\n');
		expect(outputLines).toHaveLength(20);
		expect(outputLines[0]).toBe('line11');
		expect(outputLines[19]).toBe('line30');
	});

	it('respects MESH_SYNC_LINES env var', async () => {
		process.env.MESH_SYNC_LINES = '2';
		const input = 'a\nb\nc\nd\ne';
		const result = await transform(input, ctx);
		expect(result).toBe('d\ne');
	});

	it('returns all lines when input is shorter than limit', async () => {
		process.env.MESH_SYNC_LINES = '10';
		const input = 'one\ntwo';
		const result = await transform(input, ctx);
		expect(result).toBe('one\ntwo');
	});

	it('handles single-line input', async () => {
		const input = 'only line';
		const result = await transform(input, ctx);
		expect(result).toBe('only line');
	});

	it('returns last N lines correctly', async () => {
		process.env.MESH_SYNC_LINES = '3';
		const input = 'first\nsecond\nthird\nfourth\nfifth';
		const result = await transform(input, ctx);
		expect(result).toBe('third\nfourth\nfifth');
	});
});
