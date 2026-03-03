import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig, validateConfig } from './index.js';

const TEST_DIR = path.join(import.meta.dirname, '../../../.test-config');

beforeEach(() => {
	fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
	if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
});

describe('validateConfig', () => {
	it('accepts a valid config', () => {
		const config = {
			syncs: [{ id: 'test', source: './src.ts', target: './out.ts' }],
		};
		expect(() => validateConfig(config)).not.toThrow();
	});

	it('rejects non-object root', () => {
		expect(() => validateConfig('nope')).toThrow(/must be an object/i);
	});

	it('rejects missing syncs', () => {
		expect(() => validateConfig({})).toThrow(/must have a "syncs" array/i);
	});

	it('rejects duplicate ids', () => {
		const config = {
			syncs: [
				{ id: 'dup', source: './a.ts', target: './b.ts' },
				{ id: 'dup', source: './c.ts', target: './d.ts' },
			],
		};
		expect(() => validateConfig(config)).toThrow(/duplicate.*id/i);
	});

	it('rejects sync entry missing id', () => {
		const config = { syncs: [{ source: './a.ts', target: './b.ts' }] };
		expect(() => validateConfig(config)).toThrow(/must have an "id"/i);
	});

	it('rejects sync entry missing source', () => {
		const config = { syncs: [{ id: 'x', target: './b.ts' }] };
		expect(() => validateConfig(config)).toThrow(/must have a "source"/i);
	});

	it('rejects sync entry missing target', () => {
		const config = { syncs: [{ id: 'x', source: './a.ts' }] };
		expect(() => validateConfig(config)).toThrow(/must have a "target"/i);
	});

	it('accepts valid strategy watch', () => {
		const config = {
			syncs: [
				{
					id: 'x',
					source: './a.ts',
					target: './b.ts',
					strategy: { watch: true },
				},
			],
		};
		expect(() => validateConfig(config)).not.toThrow();
	});

	it('accepts valid strategy poll', () => {
		const config = {
			syncs: [
				{
					id: 'x',
					source: './a.ts',
					target: './b.ts',
					strategy: { poll: '5m' },
				},
			],
		};
		expect(() => validateConfig(config)).not.toThrow();
	});

	it('accepts valid strategy manual', () => {
		const config = {
			syncs: [
				{
					id: 'x',
					source: './a.ts',
					target: './b.ts',
					strategy: { manual: true },
				},
			],
		};
		expect(() => validateConfig(config)).not.toThrow();
	});

	it('rejects invalid poll interval', () => {
		const config = {
			syncs: [
				{
					id: 'x',
					source: './a.ts',
					target: './b.ts',
					strategy: { poll: '5x' },
				},
			],
		};
		expect(() => validateConfig(config)).toThrow(/invalid poll interval/i);
	});

	it('accepts valid poll interval', () => {
		const config = {
			syncs: [
				{
					id: 'x',
					source: './a.ts',
					target: './b.ts',
					strategy: { poll: '30s' },
				},
			],
		};
		expect(() => validateConfig(config)).not.toThrow();
	});

	it('rejects source equal to target', () => {
		const config = {
			syncs: [{ id: 'x', source: './same.ts', target: './same.ts' }],
		};
		expect(() => validateConfig(config)).toThrow(
			/source and target must not be the same/i,
		);
	});

	it('rejects duplicate targets', () => {
		const config = {
			syncs: [
				{ id: 'a', source: './a.ts', target: './out.ts' },
				{ id: 'b', source: './b.ts', target: './out.ts' },
			],
		};
		expect(() => validateConfig(config)).toThrow(/duplicate target/i);
	});
});

describe('loadConfig', () => {
	it('loads valid mesh.json', () => {
		const configPath = path.join(TEST_DIR, 'mesh.json');
		fs.writeFileSync(
			configPath,
			JSON.stringify({
				syncs: [{ id: 'test', source: './a.ts', target: './b.ts' }],
			}),
		);
		const config = loadConfig(configPath);
		expect(config.syncs).toHaveLength(1);
		expect(config.syncs[0].id).toBe('test');
	});

	it('throws if mesh.json does not exist', () => {
		expect(() => loadConfig(path.join(TEST_DIR, 'nope.json'))).toThrow(
			/not found/i,
		);
	});

	it('throws on invalid JSON', () => {
		const configPath = path.join(TEST_DIR, 'mesh.json');
		fs.writeFileSync(configPath, '{ bad json');
		expect(() => loadConfig(configPath)).toThrow();
	});

	it('throws when custom transformer file does not exist', () => {
		const configPath = path.join(TEST_DIR, 'mesh.json');
		fs.writeFileSync(
			configPath,
			JSON.stringify({
				syncs: [
					{
						id: 'x',
						source: './a.ts',
						target: './b.ts',
						transformer: './transformers/missing.ts',
					},
				],
			}),
		);
		expect(() => loadConfig(configPath)).toThrow(/transformer not found/i);
	});

	it('does not throw for builtin transformer names', () => {
		const configPath = path.join(TEST_DIR, 'mesh.json');
		fs.writeFileSync(path.join(TEST_DIR, 'a.ts'), 'content');
		fs.writeFileSync(
			configPath,
			JSON.stringify({
				syncs: [
					{
						id: 'x',
						source: './a.ts',
						target: './b.ts',
						transformer: 'passthrough',
					},
				],
			}),
		);
		expect(() => loadConfig(configPath)).not.toThrow();
	});
});
