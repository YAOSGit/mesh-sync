import { describe, expect, it } from 'vitest';
import { getBuiltinTransformerSource, isBuiltinId } from './registry.js';

describe('isBuiltinId', () => {
	it('returns true for known identifiers', () => {
		expect(isBuiltinId('passthrough')).toBe(true);
		expect(isBuiltinId('strip-comments')).toBe(true);
		expect(isBuiltinId('json-to-ts')).toBe(true);
		expect(isBuiltinId('openapi-to-types')).toBe(true);
	});

	it('returns false for paths', () => {
		expect(isBuiltinId('./my-transform.ts')).toBe(false);
		expect(isBuiltinId('/abs/path.ts')).toBe(false);
	});

	it('returns false for unknown identifiers', () => {
		expect(isBuiltinId('unknown-thing')).toBe(false);
	});
});

describe('getBuiltinTransformerSource', () => {
	it('returns source code for known identifiers', () => {
		const src = getBuiltinTransformerSource('passthrough');
		expect(typeof src).toBe('string');
		expect(src.length).toBeGreaterThan(0);
	});

	it('throws for unknown identifiers', () => {
		expect(() => getBuiltinTransformerSource('nope')).toThrow(
			/unknown.*transformer/i,
		);
	});
});
