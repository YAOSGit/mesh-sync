import { describe, expect, it } from 'vitest';
import transform from './toml-to-json.js';

describe('toml-to-json transformer', () => {
	it('converts simple key-value pairs', async () => {
		const input = 'name = "hello"\nversion = 1';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.name).toBe('hello');
		expect(parsed.version).toBe(1);
	});

	it('handles sections', async () => {
		const input = '[server]\nhost = "localhost"\nport = 8080';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.server.host).toBe('localhost');
		expect(parsed.server.port).toBe(8080);
	});

	it('handles nested sections', async () => {
		const input = '[database.connection]\nhost = "db.example.com"\nport = 5432';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.database.connection.host).toBe('db.example.com');
		expect(parsed.database.connection.port).toBe(5432);
	});

	it('handles arrays', async () => {
		const input = 'ports = [80, 443, 8080]';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.ports).toEqual([80, 443, 8080]);
	});

	it('handles booleans and comments', async () => {
		const input = '# Config file\nenabled = true\ndebug = false';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.enabled).toBe(true);
		expect(parsed.debug).toBe(false);
	});
});
