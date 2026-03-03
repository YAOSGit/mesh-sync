import { describe, expect, it } from 'vitest';
import transform from './prettify-json.js';

describe('prettify-json transformer', () => {
	it('pretty-prints minified JSON with tab indentation', async () => {
		const input = '{"name":"test","version":"1.0.0"}';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('{\n\t"name": "test",\n\t"version": "1.0.0"\n}\n');
	});

	it('adds trailing newline', async () => {
		const input = '{"a":1}';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result.endsWith('\n')).toBe(true);
	});

	it('returns source unchanged when not valid JSON', async () => {
		const input = 'export const x = 1;';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('export const x = 1;');
	});

	it('handles JSON arrays', async () => {
		const input = '[1,2,3]';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('[\n\t1,\n\t2,\n\t3\n]\n');
	});

	it('re-formats already pretty-printed JSON to use tabs', async () => {
		const input = '{\n  "key": "value"\n}';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('{\n\t"key": "value"\n}\n');
	});
});
