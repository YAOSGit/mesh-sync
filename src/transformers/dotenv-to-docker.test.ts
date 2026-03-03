import { describe, expect, it } from 'vitest';
import transform from './dotenv-to-docker.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('dotenv-to-docker transformer', () => {
	it('converts .env lines to docker-compose environment format', () => {
		const input = `DB_HOST=localhost
DB_PORT=5432`;
		const result = transform(input, ctx);
		expect(result).toBe(
			'environment:\n  - DB_HOST=localhost\n  - DB_PORT=5432\n',
		);
	});

	it('skips comments and empty lines', () => {
		const input = `# database config

DB_HOST=localhost
# port
DB_PORT=5432
`;
		const result = transform(input, ctx);
		expect(result).toBe(
			'environment:\n  - DB_HOST=localhost\n  - DB_PORT=5432\n',
		);
	});

	it('returns environment header only when input has no valid entries', () => {
		const input = `# just a comment

`;
		const result = transform(input, ctx);
		expect(result).toBe('environment:\n');
	});

	it('preserves values containing equals signs', () => {
		const input = `TOKEN=abc=def==`;
		const result = transform(input, ctx);
		expect(result).toBe('environment:\n  - TOKEN=abc=def==\n');
	});

	it('handles single entry', () => {
		const input = 'KEY=value';
		const result = transform(input, ctx);
		expect(result).toBe('environment:\n  - KEY=value\n');
	});
});
