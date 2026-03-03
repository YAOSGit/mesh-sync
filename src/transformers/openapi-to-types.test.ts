import { describe, expect, it } from 'vitest';
import transform from './openapi-to-types.js';

const ctx = { sourceId: 't', sourcePath: '', targetPath: '' };

function makeSpec(schemas: Record<string, unknown>) {
	return JSON.stringify({ openapi: '3.0.0', components: { schemas } });
}

describe('openapi-to-types transformer', () => {
	it('generates types from schemas', () => {
		const input = makeSpec({
			User: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					name: { type: 'string' },
				},
				required: ['id'],
			},
		});

		const result = transform(input, ctx);
		expect(result).toContain('export type User');
		expect(result).toContain('id: string');
		expect(result).toContain('name?: string');
	});

	it('handles empty schemas', () => {
		const input = makeSpec({});
		const result = transform(input, ctx);
		expect(result).toContain('// No schemas found');
	});

	it('generates enum as union of literals', () => {
		const input = makeSpec({
			Status: {
				type: 'string',
				enum: ['active', 'inactive', 'pending'],
			},
		});

		const result = transform(input, ctx);
		expect(result).toContain(
			"export type Status = 'active' | 'inactive' | 'pending'",
		);
	});

	it('generates allOf as intersection type', () => {
		const input = makeSpec({
			AdminUser: {
				allOf: [
					{ $ref: '#/components/schemas/User' },
					{ $ref: '#/components/schemas/AdminPermissions' },
				],
			},
		});

		const result = transform(input, ctx);
		expect(result).toContain('export type AdminUser = User & AdminPermissions');
	});

	it('generates oneOf as union type', () => {
		const input = makeSpec({
			Pet: {
				oneOf: [
					{ $ref: '#/components/schemas/Cat' },
					{ $ref: '#/components/schemas/Dog' },
				],
			},
		});

		const result = transform(input, ctx);
		expect(result).toContain('export type Pet = Cat | Dog');
	});

	it('generates anyOf as union type', () => {
		const input = makeSpec({
			Response: {
				anyOf: [
					{ $ref: '#/components/schemas/Success' },
					{ $ref: '#/components/schemas/Error' },
				],
			},
		});

		const result = transform(input, ctx);
		expect(result).toContain('export type Response = Success | Error');
	});

	it('handles nullable property', () => {
		const input = makeSpec({
			User: {
				type: 'object',
				properties: {
					name: { type: 'string', nullable: true },
				},
				required: ['name'],
			},
		});

		const result = transform(input, ctx);
		expect(result).toContain('name: string | null');
	});

	it('handles nested inline object', () => {
		const input = makeSpec({
			User: {
				type: 'object',
				properties: {
					address: {
						type: 'object',
						properties: {
							street: { type: 'string' },
							city: { type: 'string' },
						},
						required: ['street'],
					},
				},
				required: ['address'],
			},
		});

		const result = transform(input, ctx);
		expect(result).toContain('address: { street: string; city?: string }');
	});

	it('handles enum property inside an object', () => {
		const input = makeSpec({
			User: {
				type: 'object',
				properties: {
					role: { type: 'string', enum: ['admin', 'user'] },
				},
				required: ['role'],
			},
		});

		const result = transform(input, ctx);
		expect(result).toContain("role: 'admin' | 'user'");
	});

	it('handles numeric enum values', () => {
		const input = makeSpec({
			Priority: {
				type: 'integer',
				enum: [1, 2, 3],
			},
		});

		const result = transform(input, ctx);
		expect(result).toContain('export type Priority = 1 | 2 | 3');
	});
});
