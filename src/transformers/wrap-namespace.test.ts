import { describe, expect, it } from 'vitest';
import transform from './wrap-namespace.js';

describe('wrap-namespace transformer', () => {
	it('wraps source in a namespace using PascalCase sourceId', async () => {
		const input = 'export type Foo = string;';
		const result = await transform(input, {
			sourceId: 'my-api-types',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('export namespace MyApiTypes {');
		expect(result).toContain('\texport type Foo = string;');
		expect(result).toContain('}\n');
	});

	it('converts kebab-case to PascalCase', async () => {
		const input = 'const x = 1;';
		const result = await transform(input, {
			sourceId: 'hello-world',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('export namespace HelloWorld {');
	});

	it('converts snake_case to PascalCase', async () => {
		const input = 'const x = 1;';
		const result = await transform(input, {
			sourceId: 'my_api_types',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('export namespace MyApiTypes {');
	});

	it('indents each line of source by one tab', async () => {
		const input = 'line1\nline2\nline3';
		const result = await transform(input, {
			sourceId: 'ns',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('\tline1\n\tline2\n\tline3');
	});

	it('does not indent empty lines', async () => {
		const input = 'line1\n\nline2';
		const result = await transform(input, {
			sourceId: 'ns',
			sourcePath: '',
			targetPath: '',
		});
		const lines = result.split('\n');
		expect(lines[1]).toBe('\tline1');
		expect(lines[2]).toBe('');
		expect(lines[3]).toBe('\tline2');
	});
});
