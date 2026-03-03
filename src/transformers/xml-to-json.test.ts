import { describe, expect, it } from 'vitest';
import transform from './xml-to-json.js';

describe('xml-to-json transformer', () => {
	it('converts simple element with text', async () => {
		const input = '<name>Hello</name>';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed['#text']).toBe('Hello');
	});

	it('converts element with attributes', async () => {
		const input = '<user id="1" role="admin">Alice</user>';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed['@attributes'].id).toBe('1');
		expect(parsed['@attributes'].role).toBe('admin');
		expect(parsed['#text']).toBe('Alice');
	});

	it('converts nested elements', async () => {
		const input = '<root><name>Test</name><value>42</value></root>';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.name['#text']).toBe('Test');
		expect(parsed.value['#text']).toBe('42');
	});

	it('converts self-closing tags', async () => {
		const input = '<root><item type="a" /><name>Test</name></root>';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed.item['@attributes'].type).toBe('a');
	});

	it('converts multiple same-name children to array', async () => {
		const input = '<root><item>A</item><item>B</item><item>C</item></root>';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(Array.isArray(parsed.item)).toBe(true);
		expect(parsed.item).toHaveLength(3);
	});
});
