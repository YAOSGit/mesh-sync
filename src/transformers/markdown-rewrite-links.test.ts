import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import transform from './markdown-rewrite-links.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('markdown-rewrite-links transformer', () => {
	const originalEnv = process.env.MESH_SYNC_BASE_URL;

	beforeEach(() => {
		delete process.env.MESH_SYNC_BASE_URL;
	});

	afterEach(() => {
		if (originalEnv !== undefined) {
			process.env.MESH_SYNC_BASE_URL = originalEnv;
		} else {
			delete process.env.MESH_SYNC_BASE_URL;
		}
	});

	it('rewrites relative links to absolute', () => {
		process.env.MESH_SYNC_BASE_URL = 'https://github.com/user/repo/blob/main';
		const input = `See [docs](./docs/README.md) for more.`;
		const result = transform(input, ctx);
		expect(result).toBe(
			'See [docs](https://github.com/user/repo/blob/main/docs/README.md) for more.',
		);
	});

	it('rewrites relative image sources', () => {
		process.env.MESH_SYNC_BASE_URL = 'https://example.com/assets';
		const input = `![logo](./images/logo.png)`;
		const result = transform(input, ctx);
		expect(result).toBe('![logo](https://example.com/assets/images/logo.png)');
	});

	it('does not modify absolute URLs or anchors', () => {
		process.env.MESH_SYNC_BASE_URL = 'https://example.com';
		const input = `[site](https://other.com) and [section](#intro) and [mail](mailto:a@b.com)`;
		const result = transform(input, ctx);
		expect(result).toBe(input);
	});

	it('returns source unchanged when env var is not set', () => {
		const input = `[link](./path/to/file.md)`;
		const result = transform(input, ctx);
		expect(result).toBe(input);
	});

	it('handles base URL with trailing slash', () => {
		process.env.MESH_SYNC_BASE_URL = 'https://example.com/repo/';
		const input = `[readme](./README.md)`;
		const result = transform(input, ctx);
		expect(result).toBe('[readme](https://example.com/repo/README.md)');
	});
});
