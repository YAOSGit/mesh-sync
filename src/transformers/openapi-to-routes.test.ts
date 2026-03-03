import { describe, expect, it } from 'vitest';
import transform from './openapi-to-routes.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

function makeSpec(paths: Record<string, unknown>) {
	return JSON.stringify({ openapi: '3.0.0', paths });
}

describe('openapi-to-routes transformer', () => {
	it('extracts routes with method and path', () => {
		const input = makeSpec({
			'/users': {
				get: { operationId: 'getUsers' },
				post: { operationId: 'createUser' },
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('"GET /users"');
		expect(result).toContain('"POST /users"');
		expect(result).toContain('operationId: "getUsers"');
		expect(result).toContain('operationId: "createUser"');
	});

	it('extracts path parameters', () => {
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
		expect(result).toContain('"GET /users/{userId}"');
		expect(result).toContain("userId: 'string'");
	});

	it('extracts query parameters', () => {
		const input = makeSpec({
			'/users': {
				get: {
					operationId: 'listUsers',
					parameters: [
						{ name: 'limit', in: 'query', schema: { type: 'integer' } },
						{ name: 'offset', in: 'query', schema: { type: 'integer' } },
					],
				},
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain("limit?: 'number'");
		expect(result).toContain("offset?: 'number'");
	});

	it('includes response reference when available', () => {
		const input = makeSpec({
			'/users': {
				get: {
					operationId: 'getUsers',
					responses: {
						'200': {
							content: {
								'application/json': {
									schema: { $ref: '#/components/schemas/UserList' },
								},
							},
						},
					},
				},
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain("response: 'UserList'");
	});

	it('handles empty paths', () => {
		const input = makeSpec({});
		const result = transform(input, ctx);
		expect(result).toContain('// No paths found');
	});
});
