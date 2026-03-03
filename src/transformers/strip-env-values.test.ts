import { describe, expect, it } from 'vitest';
import transform from './strip-env-values.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('strip-env-values transformer', () => {
	it('strips values from KEY=value lines', () => {
		const input =
			'DATABASE_URL=postgres://localhost:5432/mydb\nAPI_KEY=secret123';
		const result = transform(input, ctx);
		expect(result).toBe('DATABASE_URL=\nAPI_KEY=');
	});

	it('preserves comments', () => {
		const input =
			'# Database config\nDB_HOST=localhost\n# API settings\nAPI_KEY=abc';
		const result = transform(input, ctx);
		expect(result).toContain('# Database config');
		expect(result).toContain('# API settings');
		expect(result).toBe(
			'# Database config\nDB_HOST=\n# API settings\nAPI_KEY=',
		);
	});

	it('preserves empty lines', () => {
		const input = 'KEY1=value1\n\nKEY2=value2\n\n# comment';
		const result = transform(input, ctx);
		expect(result).toBe('KEY1=\n\nKEY2=\n\n# comment');
	});

	it('handles values containing equals signs', () => {
		const input = 'CONNECTION_STRING=host=localhost;port=5432';
		const result = transform(input, ctx);
		expect(result).toBe('CONNECTION_STRING=');
	});

	it('handles already empty values', () => {
		const input = 'EMPTY_KEY=\nOTHER_KEY=value';
		const result = transform(input, ctx);
		expect(result).toBe('EMPTY_KEY=\nOTHER_KEY=');
	});
});
