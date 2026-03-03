import { describe, expect, it } from 'vitest';
import transform from './wrap-module.js';

describe('wrap-module transformer', () => {
	it('wraps source in declare module using sourceId', async () => {
		const input = 'export type Foo = string;';
		const result = await transform(input, {
			sourceId: 'my-lib',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain("declare module 'my-lib' {");
		expect(result).toContain('\texport type Foo = string;');
		expect(result).toContain('}\n');
	});

	it('uses the exact sourceId as module name', async () => {
		const input = 'const x = 1;';
		const result = await transform(input, {
			sourceId: '@scope/package',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain("declare module '@scope/package' {");
	});

	it('indents each line of source by one tab', async () => {
		const input = 'line1\nline2\nline3';
		const result = await transform(input, {
			sourceId: 'mod',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('\tline1\n\tline2\n\tline3');
	});

	it('does not indent empty lines', async () => {
		const input = 'line1\n\nline2';
		const result = await transform(input, {
			sourceId: 'mod',
			sourcePath: '',
			targetPath: '',
		});
		const lines = result.split('\n');
		expect(lines[1]).toBe('\tline1');
		expect(lines[2]).toBe('');
		expect(lines[3]).toBe('\tline2');
	});

	it('handles single line source', async () => {
		const input = 'export const x = 1;';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe("declare module 'test' {\n\texport const x = 1;\n}\n");
	});
});
