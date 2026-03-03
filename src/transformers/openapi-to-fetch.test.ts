import { describe, expect, it } from 'vitest';
import transform from './openapi-to-fetch.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

function makeSpec(paths: Record<string, unknown>) {
	return JSON.stringify({ openapi: '3.0.0', paths });
}

describe('openapi-to-fetch transformer', () => {
	it('generates a simple GET function', () => {
		const input = makeSpec({
			'/users': {
				get: { operationId: 'getUsers' },
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('export async function getUsers');
		expect(result).toContain("method: 'GET'");
		expect(result).toContain("new URL('/users', BASE_URL)");
	});

	it('includes BASE_URL constant', () => {
		const input = makeSpec({
			'/health': { get: { operationId: 'healthCheck' } },
		});
		const result = transform(input, ctx);
		expect(result).toContain(
			"const BASE_URL = process.env.MESH_SYNC_BASE_URL ?? ''",
		);
	});

	it('handles path parameters with interpolation', () => {
		const input = makeSpec({
			'/users/{userId}': {
				get: {
					operationId: 'getUser',
					parameters: [
						{
							name: 'userId',
							in: 'path',
							required: true,
							schema: { type: 'string' },
						},
					],
				},
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('params: { path: { userId: string }');
		expect(result).toContain('params.path.userId');
	});

	it('handles query parameters', () => {
		const input = makeSpec({
			'/items': {
				get: {
					operationId: 'listItems',
					parameters: [
						{ name: 'limit', in: 'query', schema: { type: 'integer' } },
						{ name: 'search', in: 'query', schema: { type: 'string' } },
					],
				},
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('query?: { limit?: number; search?: string }');
		expect(result).toContain('url.searchParams.set(k, String(v))');
	});

	it('handles request body for POST', () => {
		const input = makeSpec({
			'/users': {
				post: {
					operationId: 'createUser',
					requestBody: {
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/User' },
							},
						},
						required: true,
					},
				},
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('export async function createUser');
		expect(result).toContain("method: 'POST'");
		expect(result).toContain('body?: unknown');
		expect(result).toContain('JSON.stringify(params?.body)');
	});
});
