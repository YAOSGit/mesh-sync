import { describe, expect, it } from 'vitest';
import transform from './json-to-ts.js';

describe('json-to-ts transformer', () => {
	it('converts JSON to const export', () => {
		const input = '{"name":"test","version":"1.0.0"}';
		const result = transform(input, {
			sourceId: 'config',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('export const config');
		expect(result).toContain('"name": "test"');
	});

	it('uses sourceId for variable name', () => {
		const input = '{"key":"value"}';
		const result = transform(input, {
			sourceId: 'my-data',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('export const myData');
	});

	it('adds as const assertion', () => {
		const input = '{"a":1}';
		const result = transform(input, {
			sourceId: 'x',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('as const');
	});
});
