import { describe, expect, it } from 'vitest';
import transform from './json-schema-to-types.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('json-schema-to-types transformer', () => {
	it('converts an object schema with required and optional fields', () => {
		const input = JSON.stringify({
			title: 'User',
			type: 'object',
			properties: {
				id: { type: 'string' },
				name: { type: 'string' },
				age: { type: 'integer' },
			},
			required: ['id', 'name'],
		});
		const result = transform(input, ctx);
		expect(result).toContain('export type User = {');
		expect(result).toContain('id: string;');
		expect(result).toContain('name: string;');
		expect(result).toContain('age?: number;');
	});

	it('handles $ref to definitions', () => {
		const input = JSON.stringify({
			title: 'Order',
			type: 'object',
			properties: {
				user: { $ref: '#/definitions/User' },
				items: { type: 'array', items: { $ref: '#/definitions/Product' } },
			},
			required: ['user', 'items'],
			definitions: {
				User: {
					type: 'object',
					properties: { name: { type: 'string' } },
					required: ['name'],
				},
				Product: {
					type: 'object',
					properties: { sku: { type: 'string' } },
					required: ['sku'],
				},
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('export type User = {');
		expect(result).toContain('export type Product = {');
		expect(result).toContain('user: User;');
		expect(result).toContain('items: Product[];');
	});

	it('handles enum and literal union types', () => {
		const input = JSON.stringify({
			title: 'Status',
			type: 'string',
			enum: ['active', 'inactive', 'pending'],
		});
		const result = transform(input, ctx);
		expect(result).toContain(
			"export type Status = 'active' | 'inactive' | 'pending'",
		);
	});

	it('handles allOf as intersection and oneOf as union', () => {
		const input = JSON.stringify({
			definitions: {
				Admin: {
					allOf: [
						{ $ref: '#/definitions/User' },
						{
							type: 'object',
							properties: { role: { type: 'string' } },
							required: ['role'],
						},
					],
				},
				Pet: {
					oneOf: [{ $ref: '#/definitions/Cat' }, { $ref: '#/definitions/Dog' }],
				},
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('export type Admin = User & { role: string }');
		expect(result).toContain('export type Pet = Cat | Dog');
	});

	it('uses Root as fallback name when no title', () => {
		const input = JSON.stringify({
			type: 'object',
			properties: {
				value: { type: 'number' },
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('export type Root = {');
		expect(result).toContain('value?: number;');
	});
});
