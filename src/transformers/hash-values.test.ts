import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import transform from './hash-values.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

function expectedHash(value: string): string {
	return createHash('sha256').update(value).digest('hex').substring(0, 16);
}

describe('hash-values transformer', () => {
	it('hashes string values with SHA-256 (first 16 hex chars)', async () => {
		const input = JSON.stringify({ name: 'Alice' });
		const result = await transform(input, ctx);
		const parsed = JSON.parse(result);
		expect(parsed.name).toBe(expectedHash('Alice'));
		expect(parsed.name).toHaveLength(16);
	});

	it('leaves non-string values unchanged', async () => {
		const input = JSON.stringify({ count: 42, active: true, data: null });
		const result = await transform(input, ctx);
		const parsed = JSON.parse(result);
		expect(parsed.count).toBe(42);
		expect(parsed.active).toBe(true);
		expect(parsed.data).toBeNull();
	});

	it('recurses into nested objects and arrays', async () => {
		const input = JSON.stringify({
			user: { name: 'Bob', age: 30 },
			tags: ['admin', 'user'],
		});
		const result = await transform(input, ctx);
		const parsed = JSON.parse(result);
		expect(parsed.user.name).toBe(expectedHash('Bob'));
		expect(parsed.user.age).toBe(30);
		expect(parsed.tags[0]).toBe(expectedHash('admin'));
		expect(parsed.tags[1]).toBe(expectedHash('user'));
	});

	it('outputs JSON with 2-space indent and trailing newline', async () => {
		const input = JSON.stringify({ key: 'value' });
		const result = await transform(input, ctx);
		expect(result).toMatch(/^\{\n {2}"key": "[a-f0-9]{16}"\n\}\n$/);
	});

	it('produces consistent hashes for same input', async () => {
		const input1 = JSON.stringify({ a: 'hello' });
		const input2 = JSON.stringify({ a: 'hello' });
		const result1 = await transform(input1, ctx);
		const result2 = await transform(input2, ctx);
		expect(result1).toBe(result2);
	});
});
