import { describe, expect, it } from 'vitest';
import transform from './strip-exports.js';

describe('strip-exports transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

	it('strips export from function and const declarations', () => {
		const input = `export function foo() {}
export const x = 1;
export let y = 2;`;
		const result = transform(input, ctx);
		expect(result).toBe(`function foo() {}
const x = 1;
let y = 2;`);
	});

	it('removes export default and export { } lines entirely', () => {
		const input = `export default class Foo {}
export { foo, bar };
const kept = true;`;
		const result = transform(input, ctx);
		expect(result).toBe('const kept = true;');
	});

	it('strips export from type and interface declarations', () => {
		const input = `export type ID = string;
export interface Config {
  name: string;
}`;
		const result = transform(input, ctx);
		expect(result).toBe(`type ID = string;
interface Config {
  name: string;
}`);
	});

	it('handles mixed exported and non-exported code', () => {
		const input = `import { z } from 'zod';
export const schema = z.object({});
function helper() {}
export function main() {}`;
		const result = transform(input, ctx);
		expect(result).toBe(`import { z } from 'zod';
const schema = z.object({});
function helper() {}
function main() {}`);
	});

	it('returns empty string for empty input', () => {
		const result = transform('', ctx);
		expect(result).toBe('');
	});
});
