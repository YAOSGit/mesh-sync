import { describe, expect, it } from 'vitest';
import transform from './json-to-zod.js';

describe('json-to-zod transformer', () => {
	it('converts string type', () => {
		const input = '{"type":"string"}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain("import { z } from 'zod';");
		expect(result).toContain('z.string()');
	});

	it('converts object with required and optional fields', () => {
		const input = JSON.stringify({
			type: 'object',
			properties: {
				name: { type: 'string' },
				age: { type: 'number' },
				email: { type: 'string' },
			},
			required: ['name', 'age'],
		});
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('z.object({');
		expect(result).toContain('name: z.string()');
		expect(result).toContain('age: z.number()');
		expect(result).toContain('email: z.string().optional()');
		expect(result).not.toContain('name: z.string().optional()');
	});

	it('converts array type', () => {
		const input = JSON.stringify({
			type: 'array',
			items: { type: 'number' },
		});
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('z.array(z.number())');
	});

	it('converts enum', () => {
		const input = JSON.stringify({
			enum: ['red', 'green', 'blue'],
		});
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('z.enum(["red", "green", "blue"])');
	});

	it('converts boolean type', () => {
		const input = '{"type":"boolean"}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('z.boolean()');
	});
});
