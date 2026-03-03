import { describe, expect, it } from 'vitest';
import transform from './asyncapi-to-types.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('asyncapi-to-types transformer', () => {
	it('generates payload types from channel messages', () => {
		const input = JSON.stringify({
			asyncapi: '2.6.0',
			channels: {
				'user/created': {
					subscribe: {
						message: {
							payload: {
								type: 'object',
								properties: {
									id: { type: 'string' },
									name: { type: 'string' },
								},
								required: ['id', 'name'],
							},
						},
					},
				},
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('export type UserCreatedPayload = {');
		expect(result).toContain('id: string;');
		expect(result).toContain('name: string;');
		expect(result).toContain("'user/created': UserCreatedPayload;");
	});

	it('generates a Channels map type', () => {
		const input = JSON.stringify({
			asyncapi: '2.6.0',
			channels: {
				'order/placed': {
					publish: {
						message: {
							payload: {
								type: 'object',
								properties: {
									orderId: { type: 'string' },
									total: { type: 'number' },
								},
								required: ['orderId', 'total'],
							},
						},
					},
				},
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('export type Channels = {');
		expect(result).toContain("'order/placed': OrderPlacedPayload;");
	});

	it('resolves $ref to components/schemas', () => {
		const input = JSON.stringify({
			asyncapi: '2.6.0',
			channels: {
				'notification/sent': {
					subscribe: {
						message: {
							payload: {
								$ref: '#/components/schemas/Notification',
							},
						},
					},
				},
			},
			components: {
				schemas: {
					Notification: {
						type: 'object',
						properties: {
							message: { type: 'string' },
							level: { type: 'string', enum: ['info', 'warn', 'error'] },
						},
						required: ['message', 'level'],
					},
				},
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('export type Notification = {');
		expect(result).toContain("level: 'info' | 'warn' | 'error';");
	});

	it('handles arrays and nested types', () => {
		const input = JSON.stringify({
			asyncapi: '2.6.0',
			channels: {
				'batch/process': {
					subscribe: {
						message: {
							payload: {
								type: 'object',
								properties: {
									items: { type: 'array', items: { type: 'string' } },
									count: { type: 'integer' },
								},
								required: ['items'],
							},
						},
					},
				},
			},
		});
		const result = transform(input, ctx);
		expect(result).toContain('items: string[];');
		expect(result).toContain('count?: number;');
	});

	it('handles empty spec', () => {
		const input = JSON.stringify({ asyncapi: '2.6.0', channels: {} });
		const result = transform(input, ctx);
		expect(result).toContain('// No types found');
	});
});
