import { describe, expect, it } from 'vitest';
import transform from './add-banner.js';

describe('add-banner transformer', () => {
	it('prepends DO NOT EDIT banner', async () => {
		const input = 'export const x = 1;';
		const result = await transform(input, {
			sourceId: 'my-lib',
			sourcePath: 'src/types.ts',
			targetPath: 'out/types.ts',
		});
		expect(result).toContain('AUTO-GENERATED — DO NOT EDIT');
		expect(result).toContain('export const x = 1;');
	});

	it('includes sourcePath in banner', async () => {
		const input = 'const a = 1;';
		const result = await transform(input, {
			sourceId: 'api',
			sourcePath: 'schemas/api.json',
			targetPath: 'out/api.ts',
		});
		expect(result).toContain('// Source: schemas/api.json');
	});

	it('includes sourceId in banner', async () => {
		const input = 'const a = 1;';
		const result = await transform(input, {
			sourceId: 'my-generator',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('// Generator: mesh-sync (my-generator)');
	});

	it('adds blank line between banner and source', async () => {
		const input = 'export type Foo = string;';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		const lines = result.split('\n');
		const bannerEnd = lines.indexOf(
			'// =============================================================================',
			1,
		);
		expect(lines[bannerEnd + 1]).toBe('');
		expect(lines[bannerEnd + 2]).toBe('export type Foo = string;');
	});

	it('preserves multiline source content', async () => {
		const input = 'line1\nline2\nline3';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('line1\nline2\nline3');
	});
});
