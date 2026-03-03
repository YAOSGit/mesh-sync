import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import transform from './wrap.js';

describe('wrap transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };
	let origPrefix: string | undefined;
	let origSuffix: string | undefined;

	beforeEach(() => {
		origPrefix = process.env.MESH_SYNC_WRAP_PREFIX;
		origSuffix = process.env.MESH_SYNC_WRAP_SUFFIX;
	});

	afterEach(() => {
		if (origPrefix === undefined) {
			delete process.env.MESH_SYNC_WRAP_PREFIX;
		} else {
			process.env.MESH_SYNC_WRAP_PREFIX = origPrefix;
		}
		if (origSuffix === undefined) {
			delete process.env.MESH_SYNC_WRAP_SUFFIX;
		} else {
			process.env.MESH_SYNC_WRAP_SUFFIX = origSuffix;
		}
	});

	it('returns source unchanged when no env vars set', () => {
		delete process.env.MESH_SYNC_WRAP_PREFIX;
		delete process.env.MESH_SYNC_WRAP_SUFFIX;
		const input = 'content';
		const result = transform(input, ctx);
		expect(result).toBe('content');
	});

	it('adds prefix only', () => {
		process.env.MESH_SYNC_WRAP_PREFIX = '/* START */\n';
		delete process.env.MESH_SYNC_WRAP_SUFFIX;
		const input = 'body';
		const result = transform(input, ctx);
		expect(result).toBe('/* START */\nbody');
	});

	it('adds suffix only', () => {
		delete process.env.MESH_SYNC_WRAP_PREFIX;
		process.env.MESH_SYNC_WRAP_SUFFIX = '\n/* END */';
		const input = 'body';
		const result = transform(input, ctx);
		expect(result).toBe('body\n/* END */');
	});

	it('adds both prefix and suffix', () => {
		process.env.MESH_SYNC_WRAP_PREFIX = '<wrapper>\n';
		process.env.MESH_SYNC_WRAP_SUFFIX = '\n</wrapper>';
		const input = 'inner content';
		const result = transform(input, ctx);
		expect(result).toBe('<wrapper>\ninner content\n</wrapper>');
	});

	it('handles multiline source with wrapping', () => {
		process.env.MESH_SYNC_WRAP_PREFIX = 'PRE:';
		process.env.MESH_SYNC_WRAP_SUFFIX = ':POST';
		const input = 'line1\nline2';
		const result = transform(input, ctx);
		expect(result).toBe('PRE:line1\nline2:POST');
	});
});
