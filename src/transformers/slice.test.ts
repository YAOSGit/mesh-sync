import { describe, expect, it } from 'vitest';
import transform from './slice.js';

describe('slice transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

	it('extracts content between markers', () => {
		const input = [
			'before',
			'// mesh-sync:start',
			'keep this',
			'and this',
			'// mesh-sync:end',
			'after',
		].join('\n');
		const result = transform(input, ctx);
		expect(result).toBe('keep this\nand this');
	});

	it('returns source unchanged when no markers found', () => {
		const input = 'no markers here\njust plain text';
		const result = transform(input, ctx);
		expect(result).toBe('no markers here\njust plain text');
	});

	it('supports multiple marker pairs', () => {
		const input = [
			'// mesh-sync:start',
			'first slice',
			'// mesh-sync:end',
			'ignored',
			'// mesh-sync:start',
			'second slice',
			'// mesh-sync:end',
		].join('\n');
		const result = transform(input, ctx);
		expect(result).toBe('first slice\nsecond slice');
	});

	it('excludes the marker lines themselves', () => {
		const input = ['// mesh-sync:start', 'content', '// mesh-sync:end'].join(
			'\n',
		);
		const result = transform(input, ctx);
		expect(result).not.toContain('mesh-sync:start');
		expect(result).not.toContain('mesh-sync:end');
		expect(result).toBe('content');
	});

	it('handles empty slice between markers', () => {
		const input = ['// mesh-sync:start', '// mesh-sync:end'].join('\n');
		const result = transform(input, ctx);
		expect(result).toBe('');
	});
});
