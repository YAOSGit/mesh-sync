import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const TEST_DIR = path.join(import.meta.dirname, '../.test-e2e-transformers');
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

function runSync(args = '', env?: Record<string, string>): string {
	return execSync(`node ${CLI} sync ${args}`, {
		cwd: TEST_DIR,
		encoding: 'utf-8',
		env: env ? { ...process.env, ...env } : undefined,
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

describe('built-in transformers (e2e)', () => {
	it('strip-comments removes @internal lines', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.ts'),
			[
				'export const a = 1;',
				'// @internal this should be removed',
				'export const b = 2;',
				'// @internal another internal',
				'export const c = 3;',
			].join('\n'),
		);
		writeConfig([
			{
				id: 'strip',
				source: './source.ts',
				target: './out.ts',
				transformer: 'strip-comments',
			},
		]);

		runSync();
		const output = readTarget('out.ts');
		expect(output).not.toContain('@internal');
		expect(output).toContain('export const a = 1;');
		expect(output).toContain('export const b = 2;');
		expect(output).toContain('export const c = 3;');
	});

	it('json-to-ts generates TypeScript const export from JSON', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'data.json'),
			JSON.stringify({ name: 'test', version: '1.0.0' }),
		);
		writeConfig([
			{
				id: 'data',
				source: './data.json',
				target: './data.ts',
				transformer: 'json-to-ts',
			},
		]);

		runSync();
		const output = readTarget('data.ts');
		expect(output).toContain('export const');
		expect(output).toContain('as const');
		expect(output).toContain('"name"');
		expect(output).toContain('"test"');
	});

	it('openapi-to-types generates type declarations from OpenAPI spec', () => {
		const spec = {
			openapi: '3.0.0',
			info: { title: 'Test', version: '1.0.0' },
			paths: {},
			components: {
				schemas: {
					User: {
						type: 'object',
						properties: {
							id: { type: 'integer' },
							name: { type: 'string' },
						},
						required: ['id'],
					},
				},
			},
		};
		fs.writeFileSync(path.join(TEST_DIR, 'spec.json'), JSON.stringify(spec));
		writeConfig([
			{
				id: 'types',
				source: './spec.json',
				target: './types.ts',
				transformer: 'openapi-to-types',
			},
		]);

		runSync();
		const output = readTarget('types.ts');
		expect(output).toContain('Auto-generated from OpenAPI spec');
		expect(output).toContain('export type User');
		expect(output).toContain('id: number');
		expect(output).toContain('name');
	});

	it('add-banner prepends AUTO-GENERATED header', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'export const x = 1;');
		writeConfig([
			{
				id: 'banner',
				source: './source.ts',
				target: './out.ts',
				transformer: 'add-banner',
			},
		]);

		runSync();
		const output = readTarget('out.ts');
		expect(output).toContain('AUTO-GENERATED');
		expect(output).toContain('DO NOT EDIT');
		expect(output).toContain('export const x = 1;');
		// Banner should come before the source content
		const bannerIdx = output.indexOf('AUTO-GENERATED');
		const sourceIdx = output.indexOf('export const x = 1;');
		expect(bannerIdx).toBeLessThan(sourceIdx);
	});

	it('slice extracts content between mesh-sync markers', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.ts'),
			[
				'// top of file',
				'// mesh-sync:start',
				'export const keep = true;',
				'export const alsoKeep = true;',
				'// mesh-sync:end',
				'// bottom of file',
			].join('\n'),
		);
		writeConfig([
			{
				id: 'sliced',
				source: './source.ts',
				target: './out.ts',
				transformer: 'slice',
			},
		]);

		runSync();
		const output = readTarget('out.ts');
		expect(output).toContain('export const keep = true;');
		expect(output).toContain('export const alsoKeep = true;');
		expect(output).not.toContain('top of file');
		expect(output).not.toContain('bottom of file');
		expect(output).not.toContain('mesh-sync:start');
		expect(output).not.toContain('mesh-sync:end');
	});

	it('env-filter keeps only lines matching MESH_SYNC_ENV_PREFIX', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.env'),
			[
				'PUBLIC_API_URL=https://api.example.com',
				'SECRET_KEY=supersecret',
				'PUBLIC_APP_NAME=myapp',
				'DATABASE_URL=postgres://localhost',
			].join('\n'),
		);
		writeConfig([
			{
				id: 'env',
				source: './source.env',
				target: './out.env',
				transformer: 'env-filter',
			},
		]);

		runSync('', { MESH_SYNC_ENV_PREFIX: 'PUBLIC_' });
		const output = readTarget('out.env');
		expect(output).toContain('PUBLIC_API_URL=https://api.example.com');
		expect(output).toContain('PUBLIC_APP_NAME=myapp');
		expect(output).not.toContain('SECRET_KEY');
		expect(output).not.toContain('DATABASE_URL');
	});

	it('json-pick keeps only specified keys via MESH_SYNC_PICK', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'package.json'),
			JSON.stringify({
				name: 'my-app',
				version: '2.0.0',
				private: true,
				dependencies: { foo: '1.0.0' },
			}),
		);
		writeConfig([
			{
				id: 'pick',
				source: './package.json',
				target: './picked.json',
				transformer: 'json-pick',
			},
		]);

		runSync('', { MESH_SYNC_PICK: 'name,version' });
		const output = readTarget('picked.json');
		const parsed = JSON.parse(output);
		expect(parsed).toHaveProperty('name', 'my-app');
		expect(parsed).toHaveProperty('version', '2.0.0');
		expect(parsed).not.toHaveProperty('private');
		expect(parsed).not.toHaveProperty('dependencies');
	});

	it('json-omit removes specified keys via MESH_SYNC_OMIT', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'package.json'),
			JSON.stringify({
				name: 'my-app',
				version: '2.0.0',
				private: true,
				devDependencies: { vitest: '1.0.0' },
			}),
		);
		writeConfig([
			{
				id: 'omit',
				source: './package.json',
				target: './omitted.json',
				transformer: 'json-omit',
			},
		]);

		runSync('', { MESH_SYNC_OMIT: 'private,devDependencies' });
		const output = readTarget('omitted.json');
		const parsed = JSON.parse(output);
		expect(parsed).toHaveProperty('name', 'my-app');
		expect(parsed).toHaveProperty('version', '2.0.0');
		expect(parsed).not.toHaveProperty('private');
		expect(parsed).not.toHaveProperty('devDependencies');
	});

	it('replace substitutes pattern with replacement via env vars', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.txt'),
			'foo is great, foo is awesome, foo forever',
		);
		writeConfig([
			{
				id: 'replaced',
				source: './source.txt',
				target: './out.txt',
				transformer: 'replace',
			},
		]);

		runSync('', {
			MESH_SYNC_REPLACE_PATTERN: 'foo',
			MESH_SYNC_REPLACE_WITH: 'bar',
		});
		const output = readTarget('out.txt');
		expect(output).toBe('bar is great, bar is awesome, bar forever');
		expect(output).not.toContain('foo');
	});

	it('head keeps only first N lines via MESH_SYNC_LINES', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.txt'),
			['line1', 'line2', 'line3', 'line4', 'line5', 'line6'].join('\n'),
		);
		writeConfig([
			{
				id: 'headed',
				source: './source.txt',
				target: './out.txt',
				transformer: 'head',
			},
		]);

		runSync('', { MESH_SYNC_LINES: '3' });
		const output = readTarget('out.txt');
		const lines = output.split('\n');
		expect(lines).toHaveLength(3);
		expect(lines[0]).toBe('line1');
		expect(lines[1]).toBe('line2');
		expect(lines[2]).toBe('line3');
	});

	it('tail keeps only last N lines via MESH_SYNC_LINES', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.txt'),
			['line1', 'line2', 'line3', 'line4', 'line5', 'line6'].join('\n'),
		);
		writeConfig([
			{
				id: 'tailed',
				source: './source.txt',
				target: './out.txt',
				transformer: 'tail',
			},
		]);

		runSync('', { MESH_SYNC_LINES: '3' });
		const output = readTarget('out.txt');
		const lines = output.split('\n');
		expect(lines).toHaveLength(3);
		expect(lines[0]).toBe('line4');
		expect(lines[1]).toBe('line5');
		expect(lines[2]).toBe('line6');
	});

	it('wrap adds prefix and suffix via MESH_SYNC_WRAP_PREFIX and MESH_SYNC_WRAP_SUFFIX', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.txt'), 'content here');
		writeConfig([
			{
				id: 'wrapped',
				source: './source.txt',
				target: './out.txt',
				transformer: 'wrap',
			},
		]);

		runSync('', {
			MESH_SYNC_WRAP_PREFIX: '// START\n',
			MESH_SYNC_WRAP_SUFFIX: '\n// END',
		});
		const output = readTarget('out.txt');
		expect(output).toBe('// START\ncontent here\n// END');
		expect(output.startsWith('// START\n')).toBe(true);
		expect(output.endsWith('\n// END')).toBe(true);
	});
});
