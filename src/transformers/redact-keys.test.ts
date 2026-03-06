import { afterEach, describe, expect, it } from 'vitest';
import transform from './redact-keys.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('redact-keys transformer', () => {
	afterEach(() => {
		delete process.env.MESH_SYNC_REDACT_KEYS;
	});

	it('redacts default sensitive keys', async () => {
		const input = JSON.stringify({ password: 'hunter2', name: 'Alice' });
		const result = await transform(input, ctx);
		const parsed = JSON.parse(result);
		expect(parsed.password).toBe('[REDACTED]');
		expect(parsed.name).toBe('Alice');
	});

	it('performs case-insensitive matching', async () => {
		const input = JSON.stringify({
			Password: 'secret123',
			SECRET: 'value',
			Token: 'abc',
		});
		const result = await transform(input, ctx);
		const parsed = JSON.parse(result);
		expect(parsed.Password).toBe('[REDACTED]');
		expect(parsed.SECRET).toBe('[REDACTED]');
		expect(parsed.Token).toBe('[REDACTED]');
	});

	it('handles nested objects and arrays', async () => {
		const input = JSON.stringify({
			user: { name: 'Bob', password: 'pass123' },
			tokens: [{ token: 'abc' }, { token: 'def' }],
		});
		const result = await transform(input, ctx);
		const parsed = JSON.parse(result);
		expect(parsed.user.password).toBe('[REDACTED]');
		expect(parsed.user.name).toBe('Bob');
		expect(parsed.tokens[0].token).toBe('[REDACTED]');
		expect(parsed.tokens[1].token).toBe('[REDACTED]');
	});

	it('uses custom keys from MESH_SYNC_REDACT_KEYS env var', async () => {
		process.env.MESH_SYNC_REDACT_KEYS = 'ssn,credit_card';
		const input = JSON.stringify({
			ssn: '123-45-6789',
			credit_card: '4111',
			name: 'Alice',
			password: 'ok',
		});
		const result = await transform(input, ctx);
		const parsed = JSON.parse(result);
		expect(parsed.ssn).toBe('[REDACTED]');
		expect(parsed.credit_card).toBe('[REDACTED]');
		expect(parsed.name).toBe('Alice');
		expect(parsed.password).toBe('ok');
	});

	it('outputs JSON with tab indent and trailing newline', async () => {
		const input = JSON.stringify({ key: 'value' });
		const result = await transform(input, ctx);
		expect(result).toBe('{\n\t"key": "value"\n}\n');
	});
});
