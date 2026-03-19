import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const CLI = path.resolve(import.meta.dirname, '../dist/cli.js');

describe('mesh-sync init (e2e)', () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mesh-sync-e2e-init-'));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	function run(args: string[]): { stdout: string; stderr: string; exitCode: number } {
		try {
			const stdout = execFileSync('node', [CLI, ...args], {
				cwd: tmpDir,
				encoding: 'utf-8',
				timeout: 10_000,
			});
			return { stdout, stderr: '', exitCode: 0 };
		} catch (err: unknown) {
			const e = err as { stdout?: string; stderr?: string; status?: number };
			return {
				stdout: e.stdout ?? '',
				stderr: e.stderr ?? '',
				exitCode: e.status ?? 1,
			};
		}
	}

	it('init --help shows init options', () => {
		const { stdout, exitCode } = run(['init', '--help']);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('init');
		expect(stdout).toContain('Scaffold');
	});

	it('init in a temp directory creates mesh.json', () => {
		const { stdout, exitCode } = run(['init']);
		expect(exitCode).toBe(0);
		expect(stdout).toContain('Created mesh.json');

		const configPath = path.join(tmpDir, 'mesh.json');
		expect(fs.existsSync(configPath)).toBe(true);
	});

	it('created mesh.json is valid JSON with syncs array', () => {
		run(['init']);

		const configPath = path.join(tmpDir, 'mesh.json');
		const raw = fs.readFileSync(configPath, 'utf-8');
		const parsed = JSON.parse(raw);
		expect(parsed).toHaveProperty('syncs');
		expect(Array.isArray(parsed.syncs)).toBe(true);
		expect(parsed.syncs.length).toBeGreaterThan(0);
		expect(parsed.syncs[0]).toHaveProperty('id');
		expect(parsed.syncs[0]).toHaveProperty('source');
		expect(parsed.syncs[0]).toHaveProperty('target');
	});

	it('init creates transformers/ directory and example transformer', () => {
		run(['init']);

		const transformersDir = path.join(tmpDir, 'transformers');
		expect(fs.existsSync(transformersDir)).toBe(true);

		const examplePath = path.join(transformersDir, 'example.ts');
		expect(fs.existsSync(examplePath)).toBe(true);
		const content = fs.readFileSync(examplePath, 'utf-8');
		expect(content).toContain('transform');
	});

	it('init fails if mesh.json already exists', () => {
		// First init succeeds
		run(['init']);

		// Second init should fail
		const { stderr, exitCode } = run(['init']);
		expect(exitCode).toBe(1);
		expect(stderr).toContain('already exists');
	});
});
