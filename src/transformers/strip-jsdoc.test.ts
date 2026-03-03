import { describe, expect, it } from 'vitest';
import transform from './strip-jsdoc.js';

describe('strip-jsdoc transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

	it('removes JSDoc comment blocks', () => {
		const input = `/**
 * This is a JSDoc comment.
 * @param x - the value
 */
function foo(x: number) {}`;
		const result = transform(input, ctx);
		expect(result).toBe('function foo(x: number) {}');
		expect(result).not.toContain('JSDoc');
	});

	it('keeps regular block comments and line comments', () => {
		const input = `/* This is a regular comment */
// This is a line comment
const x = 1;`;
		const result = transform(input, ctx);
		expect(result).toContain('/* This is a regular comment */');
		expect(result).toContain('// This is a line comment');
	});

	it('removes multiple JSDoc blocks', () => {
		const input = `/** First doc */
function a() {}
/** Second doc */
function b() {}`;
		const result = transform(input, ctx);
		expect(result).not.toContain('First doc');
		expect(result).not.toContain('Second doc');
		expect(result).toContain('function a() {}');
		expect(result).toContain('function b() {}');
	});

	it('handles JSDoc with nested asterisks', () => {
		const input = `/**
 * Multiplies a * b
 * @returns a ** b
 */
const multiply = (a: number, b: number) => a * b;`;
		const result = transform(input, ctx);
		expect(result).toBe('const multiply = (a: number, b: number) => a * b;');
	});

	it('returns empty string for empty input', () => {
		const result = transform('', ctx);
		expect(result).toBe('');
	});
});
