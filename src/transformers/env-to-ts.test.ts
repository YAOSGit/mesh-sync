import { describe, expect, it } from 'vitest';
import transform from './env-to-ts.js';

describe('env-to-ts transformer', () => {
	it('converts simple env vars to TypeScript', () => {
		const input = 'DB_HOST=localhost\nDB_PORT=5432';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('export type Env = {');
		expect(result).toContain('DB_HOST: string;');
		expect(result).toContain('DB_PORT: string;');
		expect(result).toContain('DB_HOST: "localhost"');
		expect(result).toContain('DB_PORT: "5432"');
		expect(result).toContain('} as const;');
	});

	it('skips comments and empty lines', () => {
		const input = '# Database config\n\nKEY=value\n# Another comment';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('KEY: string;');
		expect(result).toContain('KEY: "value"');
		expect(result).not.toContain('#');
	});

	it('strips quotes from values', () => {
		const input = 'NAME="hello world"\nOTHER=\'single quoted\'';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('NAME: "hello world"');
		expect(result).toContain('OTHER: "single quoted"');
	});

	it('handles empty input', () => {
		const input = '';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('export type Env = {};');
		expect(result).toContain('export const env: Env = {} as const;');
	});
});
