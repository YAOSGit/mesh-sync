import { describe, expect, it } from 'vitest';
import transform from './extract-types.js';

describe('extract-types transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

	it('keeps type aliases and interface declarations', () => {
		const input = `const x = 1;
type ID = string;
interface Config {
  name: string;
}
function foo() {}`;
		const result = transform(input, ctx);
		expect(result).toBe(`type ID = string;
interface Config {
  name: string;
}`);
	});

	it('keeps exported type/interface/enum declarations', () => {
		const input = `export type Status = 'ok' | 'err';
export interface User {
  id: number;
}
export enum Color {
  Red,
  Blue,
}
export const value = 42;`;
		const result = transform(input, ctx);
		expect(result).toBe(`export type Status = 'ok' | 'err';
export interface User {
  id: number;
}
export enum Color {
  Red,
  Blue,
}`);
	});

	it('keeps import type statements', () => {
		const input = `import type { Foo } from './foo.js';
import { bar } from './bar.js';
type Baz = Foo & { extra: boolean };`;
		const result = transform(input, ctx);
		expect(result).toBe(`import type { Foo } from './foo.js';
type Baz = Foo & { extra: boolean };`);
	});

	it('removes functions and variables entirely', () => {
		const input = `const a = 1;
let b = 2;
function test() { return 3; }
class MyClass {}`;
		const result = transform(input, ctx);
		expect(result).toBe('');
	});

	it('returns empty string for empty input', () => {
		const result = transform('', ctx);
		expect(result).toBe('');
	});
});
