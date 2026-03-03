import { describe, expect, it } from 'vitest';
import transform from './strip-imports.js';

describe('strip-imports transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

	it('removes single-line import statements', () => {
		const input = `import { foo } from './foo.js';
import bar from 'bar';
const x = 1;`;
		const result = transform(input, ctx);
		expect(result).toBe('const x = 1;');
	});

	it('removes side-effect imports and import type', () => {
		const input = `import './polyfill.js';
import type { Config } from './types.js';
export const value = 42;`;
		const result = transform(input, ctx);
		expect(result).toBe('export const value = 42;');
	});

	it('removes require statements', () => {
		const input = `const fs = require('fs');
const path = require('path');
function readFile() { return fs.readFileSync('x'); }`;
		const result = transform(input, ctx);
		expect(result).toBe("function readFile() { return fs.readFileSync('x'); }");
	});

	it('removes multi-line import statements', () => {
		const input = `import {
  alpha,
  beta,
  gamma,
} from './utils.js';
const result = alpha();`;
		const result = transform(input, ctx);
		expect(result).toBe('const result = alpha();');
	});

	it('returns empty string for empty input', () => {
		const result = transform('', ctx);
		expect(result).toBe('');
	});
});
