import { describe, expect, it } from 'vitest';
import transform from './dedupe-lines.js';

describe('dedupe-lines transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

	it('removes duplicate lines keeping first occurrence', async () => {
		const input = 'a\nb\na\nc\nb';
		const result = await transform(input, ctx);
		expect(result).toBe('a\nb\nc');
	});

	it('returns unchanged content when no duplicates', async () => {
		const input = 'x\ny\nz';
		const result = await transform(input, ctx);
		expect(result).toBe('x\ny\nz');
	});

	it('preserves trailing newline if original had one', async () => {
		const input = 'a\nb\na\n';
		const result = await transform(input, ctx);
		expect(result).toBe('a\nb\n');
	});

	it('does not add trailing newline if original lacked one', async () => {
		const input = 'dup\ndup';
		const result = await transform(input, ctx);
		expect(result).toBe('dup');
		expect(result.endsWith('\n')).toBe(false);
	});

	it('handles all identical lines', async () => {
		const input = 'same\nsame\nsame';
		const result = await transform(input, ctx);
		expect(result).toBe('same');
	});
});
