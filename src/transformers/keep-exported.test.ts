import { describe, expect, it } from 'vitest';
import transform from './keep-exported.js';

describe('keep-exported transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

	it('keeps only exported declarations', () => {
		const input = `function helper() {}
export function main() {}
const secret = 42;
export const PUBLIC = 'yes';`;
		const result = transform(input, ctx);
		expect(result).toBe(`export function main() {}
export const PUBLIC = 'yes';`);
	});

	it('keeps exported multi-line blocks', () => {
		const input = `function internal() {
  return 1;
}
export interface Config {
  name: string;
  value: number;
}
const x = 2;`;
		const result = transform(input, ctx);
		expect(result).toBe(`export interface Config {
  name: string;
  value: number;
}`);
	});

	it('keeps import statements', () => {
		const input = `import { z } from 'zod';
import type { Foo } from './foo.js';
const helper = 1;
export const schema = z.object({});`;
		const result = transform(input, ctx);
		expect(result).toBe(`import { z } from 'zod';
import type { Foo } from './foo.js';
export const schema = z.object({});`);
	});

	it('removes all non-exported code', () => {
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
