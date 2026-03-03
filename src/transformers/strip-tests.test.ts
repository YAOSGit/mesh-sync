import { describe, expect, it } from 'vitest';
import transform from './strip-tests.js';

describe('strip-tests transformer', () => {
	const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

	it('removes describe and it blocks', () => {
		const input = `import { describe, expect, it } from 'vitest';

describe('my suite', () => {
  it('does something', () => {
    expect(true).toBe(true);
  });
});

const helper = 42;`;
		const result = transform(input, ctx);
		expect(result).not.toContain('describe');
		expect(result).not.toContain('it(');
		expect(result).toContain('const helper = 42;');
	});

	it('removes beforeEach/afterEach/beforeAll/afterAll blocks', () => {
		const input = `beforeEach(() => {
  setup();
});

afterAll(() => {
  cleanup();
});

function production() {}`;
		const result = transform(input, ctx);
		expect(result).not.toContain('beforeEach');
		expect(result).not.toContain('afterAll');
		expect(result).toContain('function production() {}');
	});

	it('removes test() blocks', () => {
		const input = `test('adds numbers', () => {
  expect(1 + 1).toBe(2);
});

export function add(a: number, b: number) { return a + b; }`;
		const result = transform(input, ctx);
		expect(result).not.toContain('test(');
		expect(result).toContain('export function add');
	});

	it('keeps non-test code intact', () => {
		const input = `const x = 1;
function helper() { return x; }
export default helper;`;
		const result = transform(input, ctx);
		expect(result).toBe(input);
	});

	it('returns empty string for empty input', () => {
		const result = transform('', ctx);
		expect(result).toBe('');
	});
});
