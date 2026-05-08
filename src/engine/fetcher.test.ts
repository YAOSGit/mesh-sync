import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchSource } from './fetcher.js';

const TEST_DIR = path.join(import.meta.dirname, '../../.test-fetcher');

beforeEach(() => {
	fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
	if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
	vi.restoreAllMocks();
});

describe('fetchSource', () => {
	it('reads a local file', async () => {
		const filePath = path.join(TEST_DIR, 'source.ts');
		fs.writeFileSync(filePath, 'export const x = 1;');
		const result = await fetchSource({ type: 'local', value: filePath });
		expect(result.content).toBe('export const x = 1;');
		expect(result.changed).toBe(true);
	});

	it('throws for missing local file', async () => {
		await expect(
			fetchSource({ type: 'local', value: path.join(TEST_DIR, 'missing.ts') }),
		).rejects.toThrow(/not found/i);
	});

	it('detects unchanged content via hash', async () => {
		const filePath = path.join(TEST_DIR, 'source.ts');
		fs.writeFileSync(filePath, 'export const x = 1;');

		const first = await fetchSource({ type: 'local', value: filePath });
		const second = await fetchSource(
			{ type: 'local', value: filePath },
			first.hash,
		);

		expect(second.changed).toBe(false);
	});

	it('detects changed content via hash', async () => {
		const filePath = path.join(TEST_DIR, 'source.ts');
		fs.writeFileSync(filePath, 'export const x = 1;');
		const first = await fetchSource({ type: 'local', value: filePath });

		fs.writeFileSync(filePath, 'export const x = 2;');
		const second = await fetchSource(
			{ type: 'local', value: filePath },
			first.hash,
		);

		expect(second.changed).toBe(true);
	});

	it('fetches from a URL', async () => {
		const mockResponse = new Response('{"openapi":"3.0.0"}', {
			status: 200,
			headers: { ETag: '"abc123"' },
		});
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

		const result = await fetchSource({
			type: 'url',
			value: 'https://example.com/spec.json',
		});
		expect(result.content).toBe('{"openapi":"3.0.0"}');
		expect(result.etag).toBe('"abc123"');
	});

	it('returns unchanged when ETag matches', async () => {
		const mockResponse = new Response(null, { status: 304 });
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

		const result = await fetchSource(
			{ type: 'url', value: 'https://example.com/spec.json' },
			undefined,
			'"abc123"',
		);
		expect(result.changed).toBe(false);
	});

	it('fetches from a git source via raw URL', async () => {
		const mockResponse = new Response('export type User = { id: string };', {
			status: 200,
			headers: { ETag: '"git123"' },
		});
		vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

		const result = await fetchSource({
			type: 'git',
			host: 'github.com',
			repo: 'org/repo',
			ref: 'main',
			path: 'src/types.ts',
		});

		expect(result.content).toBe('export type User = { id: string };');
		expect(result.changed).toBe(true);
		expect(globalThis.fetch).toHaveBeenCalledWith(
			'https://raw.githubusercontent.com/org/repo/main/src/types.ts',
			expect.any(Object),
		);
	});

	it('adds auth header when MESH_SYNC_GIT_TOKEN is set', async () => {
		const originalToken = process.env.MESH_SYNC_GIT_TOKEN;
		process.env.MESH_SYNC_GIT_TOKEN = 'ghp_test_token_123';

		const mockResponse = new Response('content', { status: 200 });
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(mockResponse);

		await fetchSource({
			type: 'git',
			host: 'github.com',
			repo: 'org/private-repo',
			ref: 'main',
			path: 'secret.ts',
		});

		const calledHeaders = fetchSpy.mock.calls[0][1]?.headers as Record<
			string,
			string
		>;
		expect(calledHeaders.Authorization).toBe('Bearer ghp_test_token_123');

		if (originalToken === undefined) {
			delete process.env.MESH_SYNC_GIT_TOKEN;
		} else {
			process.env.MESH_SYNC_GIT_TOKEN = originalToken;
		}
	});

	it('retries on network error and succeeds', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		fetchSpy
			.mockRejectedValueOnce(new TypeError('fetch failed'))
			.mockRejectedValueOnce(new TypeError('fetch failed'))
			.mockResolvedValueOnce(new Response('ok', { status: 200 }));

		const result = await fetchSource({
			type: 'url',
			value: 'https://example.com/data',
		});
		expect(result.content).toBe('ok');
		expect(fetchSpy).toHaveBeenCalledTimes(3);
	});

	it('retries on 503 then succeeds on 200', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		fetchSpy
			.mockResolvedValueOnce(new Response('', { status: 503 }))
			.mockResolvedValueOnce(new Response('ok', { status: 200 }));

		const result = await fetchSource({
			type: 'url',
			value: 'https://example.com/data',
		});
		expect(result.content).toBe('ok');
		expect(fetchSpy).toHaveBeenCalledTimes(2);
	});

	it('does not retry on 404', async () => {
		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
			new Response('Not Found', { status: 404, statusText: 'Not Found' }),
		);

		await expect(
			fetchSource({ type: 'url', value: 'https://example.com/missing' }),
		).rejects.toThrow(/404/);
		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
	});

	it('exhausts retries on persistent network errors', async () => {
		vi.spyOn(globalThis, 'fetch')
			.mockRejectedValueOnce(new TypeError('fetch failed'))
			.mockRejectedValueOnce(new TypeError('fetch failed'))
			.mockRejectedValueOnce(new TypeError('fetch failed'));

		await expect(
			fetchSource({ type: 'url', value: 'https://example.com/flaky' }),
		).rejects.toThrow(/Failed to fetch.*after 3 retries/);
	});

	it('does not add auth header when MESH_SYNC_GIT_TOKEN is unset', async () => {
		const originalToken = process.env.MESH_SYNC_GIT_TOKEN;
		delete process.env.MESH_SYNC_GIT_TOKEN;

		const mockResponse = new Response('content', { status: 200 });
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockResolvedValue(mockResponse);

		await fetchSource({
			type: 'git',
			host: 'github.com',
			repo: 'org/repo',
			ref: 'main',
			path: 'file.ts',
		});

		const calledHeaders = fetchSpy.mock.calls[0][1]?.headers as Record<
			string,
			string
		>;
		expect(calledHeaders.Authorization).toBeUndefined();

		if (originalToken !== undefined) {
			process.env.MESH_SYNC_GIT_TOKEN = originalToken;
		}
	});
});
