import { describe, expect, it } from 'vitest';
import transform from './json-flatten.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('json-flatten transformer', () => {
	it('flattens nested objects to dot-notation keys', () => {
		const input = JSON.stringify({ a: { b: { c: 1 }, d: 2 } });
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({ 'a.b.c': 1, 'a.d': 2 });
	});

	it('flattens arrays with index notation', () => {
		const input = JSON.stringify({ items: ['x', 'y', 'z'] });
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({
			'items.0': 'x',
			'items.1': 'y',
			'items.2': 'z',
		});
	});

	it('handles flat input without nesting', () => {
		const input = JSON.stringify({ a: 1, b: 'hello', c: true });
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({ a: 1, b: 'hello', c: true });
	});

	it('handles deeply nested structures with arrays', () => {
		const input = JSON.stringify({ a: { b: [10, 20] } });
		const result = transform(input, ctx);
		expect(JSON.parse(result as string)).toEqual({ 'a.b.0': 10, 'a.b.1': 20 });
	});

	it('outputs with tab indent and trailing newline', () => {
		const input = JSON.stringify({ x: 1 });
		const result = transform(input, ctx);
		expect(result).toBe('{\n\t"x": 1\n}\n');
	});
});
