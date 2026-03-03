import { describe, expect, it } from 'vitest';
import transform from './validate-no-secrets.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('validate-no-secrets transformer', () => {
	it('passes through clean content unchanged', () => {
		const input =
			'export const config = {\n  host: "localhost",\n  port: 3000\n};';
		const result = transform(input, ctx);
		expect(result).toBe(input);
	});

	it('throws on AWS access key', () => {
		const input = 'aws_access_key_id = AKIAIOSFODNN7EXAMPLE';
		expect(() => transform(input, ctx)).toThrow('Secrets detected');
		expect(() => transform(input, ctx)).toThrow('AWS Access Key');
	});

	it('throws on private key blocks', () => {
		const input = 'cert:\n-----BEGIN RSA PRIVATE KEY-----\nMIIBogIBAAJ...';
		expect(() => transform(input, ctx)).toThrow('Private Key');
	});

	it('throws on Bearer tokens and reports line number', () => {
		const input =
			'line one\nAuthorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig';
		expect(() => transform(input, ctx)).toThrow('line 2');
		expect(() => transform(input, ctx)).toThrow('Bearer Token');
	});

	it('throws on password/token/secret assignments', () => {
		const input = 'password=supersecret123';
		expect(() => transform(input, ctx)).toThrow('Secrets detected');
		expect(() => transform(input, ctx)).toThrow('password assignment');
	});
});
