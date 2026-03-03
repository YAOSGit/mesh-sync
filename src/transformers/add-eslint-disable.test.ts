import { describe, expect, it } from 'vitest';
import transform from './add-eslint-disable.js';

describe('add-eslint-disable transformer', () => {
	it('prepends eslint-disable comment', async () => {
		const input = 'export const x = 1;';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('/* eslint-disable */\nexport const x = 1;');
	});

	it('does not add duplicate if already present', async () => {
		const input = '/* eslint-disable */\nexport const x = 1;';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('/* eslint-disable */\nexport const x = 1;');
	});

	it('prepends to multiline source', async () => {
		const input = 'const a = 1;\nconst b = 2;';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		const lines = result.split('\n');
		expect(lines[0]).toBe('/* eslint-disable */');
		expect(lines[1]).toBe('const a = 1;');
		expect(lines[2]).toBe('const b = 2;');
	});

	it('handles empty source', async () => {
		const input = '';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('/* eslint-disable */\n');
	});

	it('does not treat partial match as duplicate', async () => {
		const input = '/* eslint-disable no-console */\nexport const x = 1;';
		const result = await transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe(
			'/* eslint-disable */\n/* eslint-disable no-console */\nexport const x = 1;',
		);
	});
});
