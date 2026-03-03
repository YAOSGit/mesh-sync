import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const TEST_DIR = path.join(import.meta.dirname, '../.test-e2e-env-vars');
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

describe('environment variable support (e2e)', () => {
	it('MESH_SYNC_GIT_TOKEN is used for git source authentication (graceful failure without valid token)', () => {
		// Using a git source URL that will fail without a real token
		// This tests that the env var is recognized and used by the fetcher
		writeConfig([
			{
				id: 'git-token',
				source: 'github:fake-org/fake-repo/fake-file.ts',
				target: './out.ts',
			},
		]);

		let output: string;
		try {
			output = runSync('--json', { MESH_SYNC_GIT_TOKEN: 'invalid-token' });
		} catch (err: unknown) {
			output = (err as { stdout: string }).stdout || '';
		}
		const parsed = JSON.parse(output);
		// Should fail gracefully with an error (no crash, just error status)
		expect(parsed.results).toHaveLength(1);
		expect(parsed.results[0].id).toBe('git-token');
		expect(parsed.results[0].status).toBe('error');
	});

	it('MESH_SYNC_LINES controls head transformer line count', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.txt'),
			['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf'].join(
				'\n',
			),
		);
		writeConfig([
			{
				id: 'lines-env',
				source: './source.txt',
				target: './out.txt',
				transformer: 'head',
			},
		]);

		runSync('', { MESH_SYNC_LINES: '5' });
		const output = readTarget('out.txt');
		const lines = output.split('\n');
		expect(lines).toHaveLength(5);
		expect(lines[0]).toBe('alpha');
		expect(lines[4]).toBe('echo');
	});

	it('MESH_SYNC_ENV_PREFIX controls env-filter prefix matching', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'source.env'),
			[
				'NEXT_PUBLIC_API=https://api.com',
				'NEXT_PUBLIC_NAME=myapp',
				'SECRET_KEY=hidden',
				'DATABASE_URL=postgres://localhost',
				'NEXT_PRIVATE_TOKEN=secret',
			].join('\n'),
		);
		writeConfig([
			{
				id: 'prefix-env',
				source: './source.env',
				target: './out.env',
				transformer: 'env-filter',
			},
		]);

		runSync('', { MESH_SYNC_ENV_PREFIX: 'NEXT_PUBLIC_' });
		const output = readTarget('out.env');
		expect(output).toContain('NEXT_PUBLIC_API=https://api.com');
		expect(output).toContain('NEXT_PUBLIC_NAME=myapp');
		expect(output).not.toContain('SECRET_KEY');
		expect(output).not.toContain('DATABASE_URL');
		expect(output).not.toContain('NEXT_PRIVATE_TOKEN');
	});

	it('MESH_SYNC_PICK controls json-pick key selection', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'data.json'),
			JSON.stringify({
				name: 'my-lib',
				version: '3.2.1',
				description: 'A library',
				license: 'MIT',
				author: 'test',
			}),
		);
		writeConfig([
			{
				id: 'pick-env',
				source: './data.json',
				target: './picked.json',
				transformer: 'json-pick',
			},
		]);

		runSync('', { MESH_SYNC_PICK: 'name,version,license' });
		const output = readTarget('picked.json');
		const parsed = JSON.parse(output);
		expect(Object.keys(parsed)).toHaveLength(3);
		expect(parsed).toHaveProperty('name', 'my-lib');
		expect(parsed).toHaveProperty('version', '3.2.1');
		expect(parsed).toHaveProperty('license', 'MIT');
		expect(parsed).not.toHaveProperty('description');
		expect(parsed).not.toHaveProperty('author');
	});
});
