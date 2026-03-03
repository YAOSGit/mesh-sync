import { describe, expect, it } from 'vitest';
import transform from './strip-comments.js';

describe('strip-comments transformer', () => {
	it('removes // @internal lines', () => {
		const input = `export const pub = 1;
// @internal this is private
export const priv = 2;`;
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).not.toContain('@internal');
		expect(result).toContain('export const pub = 1;');
	});

	it('removes /** @private */ blocks', () => {
		const input = `/** @private internal only */
function secret() {}
export function pub() {}`;
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).not.toContain('@private');
		expect(result).toContain('export function pub() {}');
	});

	it('returns unchanged content when no markers', () => {
		const input = 'export const x = 1;';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('export const x = 1;');
	});
});
