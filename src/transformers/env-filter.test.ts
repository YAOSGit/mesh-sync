import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import transform from './env-filter.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('env-filter transformer', () => {
	const originalEnv = process.env.MESH_SYNC_ENV_PREFIX;

	beforeEach(() => {
		delete process.env.MESH_SYNC_ENV_PREFIX;
	});

	afterEach(() => {
		if (originalEnv !== undefined) {
			process.env.MESH_SYNC_ENV_PREFIX = originalEnv;
		} else {
			delete process.env.MESH_SYNC_ENV_PREFIX;
		}
	});

	it('filters lines by default PUBLIC_ prefix', () => {
		const input = `PUBLIC_API=https://api.example.com
SECRET_KEY=abc123
PUBLIC_NAME=myapp`;
		const result = transform(input, ctx);
		expect(result).toBe(
			'PUBLIC_API=https://api.example.com\nPUBLIC_NAME=myapp\n',
		);
	});

	it('uses custom prefix from env var', () => {
		process.env.MESH_SYNC_ENV_PREFIX = 'NEXT_';
		const input = `NEXT_PUBLIC_URL=http://localhost
SECRET=hidden
NEXT_API_KEY=abc`;
		const result = transform(input, ctx);
		expect(result).toBe('NEXT_PUBLIC_URL=http://localhost\nNEXT_API_KEY=abc\n');
	});

	it('skips comments and empty lines', () => {
		const input = `# This is a comment
PUBLIC_A=1

# Another comment
PUBLIC_B=2
PRIVATE_C=3`;
		const result = transform(input, ctx);
		expect(result).toBe('PUBLIC_A=1\nPUBLIC_B=2\n');
	});

	it('returns only newline when no lines match', () => {
		const input = `SECRET_A=1
SECRET_B=2`;
		const result = transform(input, ctx);
		expect(result).toBe('\n');
	});

	it('handles values containing equals signs', () => {
		const input = `PUBLIC_DATA=base64==abc
PRIVATE=x`;
		const result = transform(input, ctx);
		expect(result).toBe('PUBLIC_DATA=base64==abc\n');
	});
});
