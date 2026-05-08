import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const TEST_DIR = path.join(import.meta.dirname, '../.test-e2e-chaining');
const CLI = path.join(import.meta.dirname, '../dist/cli.js');

function writeConfig(
	syncs: Array<{
		id: string;
		source: string;
		target: string;
		transformer?: string | string[];
	}>,
) {
	fs.writeFileSync(path.join(TEST_DIR, 'mesh.json'), JSON.stringify({ syncs }));
}

function writeCustomTransformer(name: string, code: string) {
	fs.writeFileSync(path.join(TEST_DIR, 'transformers', name), code);
}

function runSync(args = ''): string {
	return execSync(`node ${CLI} sync ${args}`, {
		cwd: TEST_DIR,
		encoding: 'utf-8',
	});
}

function readTarget(name: string): string {
	return fs.readFileSync(path.join(TEST_DIR, name), 'utf-8');
}

beforeEach(() => {
	fs.mkdirSync(path.join(TEST_DIR, 'transformers'), { recursive: true });
});

afterEach(() => {
	if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
});

describe('transformer chaining (e2e)', () => {
	it('chains 2 transformers: strip-comments then custom uppercase', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.ts'),
			['hello world', '// @internal secret stuff', 'goodbye world'].join('\n'),
		);
		writeCustomTransformer(
			'upper.ts',
			`const t = (s: string) => s.toUpperCase();
export default t;`,
		);
		writeConfig([
			{
				id: 'chain2',
				source: './source.ts',
				target: './out.ts',
				transformer: ['strip-comments', './transformers/upper.ts'],
			},
		]);

		runSync();
		const output = readTarget('out.ts');
		expect(output).toBe('HELLO WORLD\nGOODBYE WORLD');
		expect(output).not.toContain('@internal');
	});

	it('chains 3 transformers: strip-comments, custom trim, custom uppercase', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.ts'),
			['  hello  ', '// @internal remove me', '  world  '].join('\n'),
		);
		writeCustomTransformer(
			'trim-lines.ts',
			`const t = (s: string) => s.split('\\n').map(l => l.trim()).filter(Boolean).join('\\n');
export default t;`,
		);
		writeCustomTransformer(
			'upper.ts',
			`const t = (s: string) => s.toUpperCase();
export default t;`,
		);
		writeConfig([
			{
				id: 'chain3',
				source: './source.ts',
				target: './out.ts',
				transformer: [
					'strip-comments',
					'./transformers/trim-lines.ts',
					'./transformers/upper.ts',
				],
			},
		]);

		runSync();
		const output = readTarget('out.ts');
		expect(output).toBe('HELLO\nWORLD');
	});

	it('chains builtin + custom transformer: strip-comments then add-prefix', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.ts'),
			[
				'export const x = 1;',
				'// @internal hidden',
				'export const y = 2;',
			].join('\n'),
		);
		writeCustomTransformer(
			'add-prefix.ts',
			`const t = (s: string) => '// PREFIXED\\n' + s;
export default t;`,
		);
		writeConfig([
			{
				id: 'builtin-custom',
				source: './source.ts',
				target: './out.ts',
				transformer: ['strip-comments', './transformers/add-prefix.ts'],
			},
		]);

		runSync();
		const output = readTarget('out.ts');
		expect(output).toContain('// PREFIXED');
		expect(output).not.toContain('@internal');
		expect(output).toContain('export const x = 1;');
		// Prefix should be at the very beginning
		expect(output.startsWith('// PREFIXED')).toBe(true);
	});

	it('writes error marker when second transformer in chain throws', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'hello world');
		writeCustomTransformer(
			'bad.ts',
			`const t = (s: string) => { throw new Error('chain-boom'); };
export default t;`,
		);
		writeConfig([
			{
				id: 'chain-error',
				source: './source.ts',
				target: './out.ts',
				transformer: ['strip-comments', './transformers/bad.ts'],
			},
		]);

		try {
			runSync();
		} catch {
			// CLI exits with code 1 on error — expected
		}
		const output = readTarget('.mesh-sync-errors/out.ts');
		expect(output).toContain('MESH-SYNC SYNC FAILED');
	});

	it('passthrough works the same with no transformer specified', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'passthrough content');
		writeConfig([
			{
				id: 'pass',
				source: './source.ts',
				target: './out.ts',
			},
		]);

		runSync();
		const output = readTarget('out.ts');
		expect(output).toBe('passthrough content');
	});

	it('single builtin in array works same as string', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.ts'),
			['keep this', '// @internal remove this', 'keep this too'].join('\n'),
		);

		// Test with array form
		writeConfig([
			{
				id: 'arr',
				source: './source.ts',
				target: './out-array.ts',
				transformer: ['strip-comments'],
			},
		]);
		runSync();
		const arrayOutput = readTarget('out-array.ts');

		// Clean cache so we get a fresh sync
		const cachePath = path.join(TEST_DIR, '.mesh-sync-cache.json');
		if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);

		// Test with string form
		writeConfig([
			{
				id: 'str',
				source: './source.ts',
				target: './out-string.ts',
				transformer: 'strip-comments',
			},
		]);
		runSync();
		const stringOutput = readTarget('out-string.ts');

		expect(arrayOutput).toBe(stringOutput);
		expect(arrayOutput).not.toContain('@internal');
	});
});
