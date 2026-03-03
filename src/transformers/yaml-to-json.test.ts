import { describe, expect, it } from 'vitest';
import transform from './yaml-to-json.js';

describe('yaml-to-json transformer', () => {
	it('converts simple key-value pairs', async () => {
		const input = 'name: hello\nversion: 1';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.name).toBe('hello');
		expect(parsed.version).toBe(1);
	});

	it('handles nested objects', async () => {
		const input = 'server:\n  host: localhost\n  port: 8080';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.server.host).toBe('localhost');
		expect(parsed.server.port).toBe(8080);
	});

	it('handles arrays', async () => {
		const input = 'items:\n  - apple\n  - banana\n  - cherry';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.items).toEqual(['apple', 'banana', 'cherry']);
	});

	it('handles booleans and null', async () => {
		const input = 'enabled: true\ndebug: false\ndata: null';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.enabled).toBe(true);
		expect(parsed.debug).toBe(false);
		expect(parsed.data).toBe(null);
	});

	it('skips comments', async () => {
		const input =
			'# This is a comment\nname: test\n# Another comment\nvalue: 42';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.name).toBe('test');
		expect(parsed.value).toBe(42);
	});
});
