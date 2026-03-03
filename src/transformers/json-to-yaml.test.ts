import { describe, expect, it } from 'vitest';
import transform from './json-to-yaml.js';

describe('json-to-yaml transformer', () => {
	it('converts simple key-value pairs', () => {
		const input = '{"name":"hello","version":1}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('name: hello');
		expect(result).toContain('version: 1');
	});

	it('converts nested objects', () => {
		const input = '{"server":{"host":"localhost","port":8080}}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('server:');
		expect(result).toContain('host: localhost');
		expect(result).toContain('port: 8080');
	});

	it('converts arrays', () => {
		const input = '{"items":["apple","banana"]}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('items:');
		expect(result).toContain('- apple');
		expect(result).toContain('- banana');
	});

	it('handles booleans and null', () => {
		const input = '{"enabled":true,"debug":false,"data":null}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('enabled: true');
		expect(result).toContain('debug: false');
		expect(result).toContain('data: null');
	});

	it('quotes special strings', () => {
		const input = '{"value":"true","empty":"","num":"42"}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('value: "true"');
		expect(result).toContain('empty: ""');
		expect(result).toContain('num: "42"');
	});
});
