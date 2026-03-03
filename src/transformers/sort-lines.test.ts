import { describe, expect, it } from 'vitest';
import transform from './sort-lines.js';

describe('sort-lines transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

	it('sorts lines alphabetically', async () => {
		const input = 'cherry\napple\nbanana';
		const result = await transform(input, ctx);
		expect(result).toBe('apple\nbanana\ncherry');
	});

	it('sorts case-insensitively', async () => {
		const input = 'Banana\napple\nCherry';
		const result = await transform(input, ctx);
		expect(result).toBe('apple\nBanana\nCherry');
	});

	it('preserves trailing newline if original had one', async () => {
		const input = 'cherry\napple\nbanana\n';
		const result = await transform(input, ctx);
		expect(result).toBe('apple\nbanana\ncherry\n');
	});

	it('does not add trailing newline if original lacked one', async () => {
		const input = 'b\na';
		const result = await transform(input, ctx);
		expect(result).toBe('a\nb');
		expect(result.endsWith('\n')).toBe(false);
	});

	it('handles single-line input', async () => {
		const input = 'only';
		const result = await transform(input, ctx);
		expect(result).toBe('only');
	});
});
