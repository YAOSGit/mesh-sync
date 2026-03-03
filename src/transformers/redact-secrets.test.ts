import { describe, expect, it } from 'vitest';
import transform from './redact-secrets.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('redact-secrets transformer', () => {
	it('redacts Bearer tokens', () => {
		const input = 'Token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def';
		const result = transform(input, ctx);
		expect(result).toBe('Token: Bearer [REDACTED]');
	});

	it('redacts AWS access key IDs', () => {
		const input = 'aws_key=AKIAIOSFODNN7EXAMPLE';
		const result = transform(input, ctx);
		expect(result).toContain('[REDACTED]');
		expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
	});

	it('redacts .env format secrets', () => {
		const input = 'SECRET_KEY=mysuperSecretValue123\nAPI_KEY=abcdef123456';
		const result = transform(input, ctx);
		expect(result).toBe('SECRET_KEY=[REDACTED]\nAPI_KEY=[REDACTED]');
	});

	it('redacts JSON format secrets', () => {
		const input = '{\n  "password": "hunter2",\n  "name": "safe"\n}';
		const result = transform(input, ctx);
		expect(result).toContain('"password": "[REDACTED]"');
		expect(result).toContain('"name": "safe"');
	});

	it('redacts private key blocks', () => {
		const input =
			'before\n-----BEGIN RSA PRIVATE KEY-----\nMIIBogIBAAJBALRi...\n-----END RSA PRIVATE KEY-----\nafter';
		const result = transform(input, ctx);
		expect(result).toContain('[REDACTED PRIVATE KEY]');
		expect(result).not.toContain('MIIBogIBAAJBALRi');
		expect(result).toContain('before');
		expect(result).toContain('after');
	});
});
