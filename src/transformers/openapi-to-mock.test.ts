import { describe, expect, it } from 'vitest';
import transform from './openapi-to-mock.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

function makeSpec(schemas: Record<string, unknown>) {
	return JSON.stringify({ openapi: '3.0.0', components: { schemas } });
}

describe('openapi-to-mock transformer', () => {
	it('generates mock data for primitive types', async () => {
		const input = makeSpec({
			User: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					age: { type: 'integer' },
					active: { type: 'boolean' },
				},
			},
		});
		const result = await transform(input, ctx);
		expect(result).toContain('"name": "string-name"');
		expect(result).toContain('"age": 0');
		expect(result).toContain('"active": false');
	});

	it('uses example values when provided', async () => {
		const input = makeSpec({
			Config: {
				type: 'object',
				properties: {
					host: { type: 'string', example: 'localhost' },
					port: { type: 'integer', example: 8080 },
				},
			},
		});
		const result = await transform(input, ctx);
		expect(result).toContain('"host": "localhost"');
		expect(result).toContain('"port": 8080');
	});

	it('picks first enum value', async () => {
		const input = makeSpec({
			Status: {
				type: 'string',
				enum: ['active', 'inactive'],
			},
		});
		const result = await transform(input, ctx);
		expect(result).toContain('"Status": "active"');
	});

	it('generates array mocks with one item', async () => {
		const input = makeSpec({
			Tags: {
				type: 'array',
				items: { type: 'string' },
			},
		});
		const result = await transform(input, ctx);
		const parsed = JSON.parse(
			result
				.replace(/^\/\/.*\n\nexport const mocks = /, '')
				.replace(/ as const;\n$/, ''),
		);
		expect(parsed.Tags).toEqual(['string-Tags']);
	});

	it('handles empty schemas', async () => {
		const input = makeSpec({});
		const result = await transform(input, ctx);
		expect(result).toContain('// No schemas found');
	});
});
