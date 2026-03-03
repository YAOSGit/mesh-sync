import { describe, expect, it } from 'vitest';
import transform from './minify.js';

describe('minify transformer', () => {
	it('minifies valid JSON by removing whitespace', () => {
		const input = '{\n  "name": "test",\n  "version": "1.0.0"\n}';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('{"name":"test","version":"1.0.0"}');
	});

	it('strips leading/trailing whitespace per line for non-JSON', () => {
		const input = '  const x = 1;  \n  const y = 2;  ';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('const x = 1;\nconst y = 2;');
	});

	it('collapses multiple blank lines to one', () => {
		const input = 'line1\n\n\n\nline2';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('line1\n\nline2');
	});

	it('trims overall trailing whitespace', () => {
		const input = 'const x = 1;\n\n\n';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('const x = 1;');
	});

	it('handles JSON arrays', () => {
		const input = '[\n  1,\n  2,\n  3\n]';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('[1,2,3]');
	});
});
