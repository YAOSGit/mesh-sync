import { describe, expect, it } from 'vitest';
import transform from './passthrough.js';

describe('passthrough transformer', () => {
	const ctx = {
		sourceId: 'test',
		sourcePath: '/src/file.ts',
		targetPath: '/dest/file.ts',
	};

	it('returns the source string unchanged', () => {
		const input = 'hello world';
		expect(transform(input, ctx)).toBe(input);
	});

	it('returns an empty string unchanged', () => {
		expect(transform('', ctx)).toBe('');
	});

	it('preserves multiline content', () => {
		const input = 'line1\nline2\nline3';
		expect(transform(input, ctx)).toBe(input);
	});

	it('preserves whitespace and indentation', () => {
		const input = '  \t  indented\n\t\ttabs\n   spaces';
		expect(transform(input, ctx)).toBe(input);
	});

	it('preserves special characters', () => {
		const input = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
		expect(transform(input, ctx)).toBe(input);
	});

	it('preserves unicode content', () => {
		const input = 'Hello \u4e16\u754c \ud83c\udf0d \u00e9\u00e0\u00fc';
		expect(transform(input, ctx)).toBe(input);
	});

	it('preserves JSON content', () => {
		const input = JSON.stringify({ key: 'value', nested: { a: 1 } }, null, 2);
		expect(transform(input, ctx)).toBe(input);
	});

	it('preserves code content', () => {
		const input = 'export function hello(): string {\n\treturn "world";\n}';
		expect(transform(input, ctx)).toBe(input);
	});

	it('ignores the context parameter', () => {
		const input = 'some content';
		const altCtx = {
			sourceId: 'other',
			sourcePath: '/other/path.ts',
			targetPath: '/other/dest.ts',
		};
		expect(transform(input, ctx)).toBe(transform(input, altCtx));
	});

	it('returns the exact same reference', () => {
		const input = 'reference check';
		const result = transform(input, ctx);
		// Strict identity check — passthrough returns the same string object
		expect(result).toBe(input);
	});
});
