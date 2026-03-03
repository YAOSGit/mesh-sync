import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const TEST_DIR = path.join(import.meta.dirname, '../.test-e2e-errors');
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

function readTarget(name: string): string {
	return fs.readFileSync(path.join(TEST_DIR, name), 'utf-8');
}

beforeEach(() => {
	fs.mkdirSync(path.join(TEST_DIR, 'transformers'), { recursive: true });
});

afterEach(() => {
	if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
});

describe('error handling (e2e)', () => {
	it('writes error marker when transformer throws', () => {
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'hello');
		fs.writeFileSync(
			path.join(TEST_DIR, 'transformers', 'bad.ts'),
			`const t = (s: string) => { throw new Error('transformer-boom'); };
export default t;`,
		);
		writeConfig([
			{
				id: 'err-transform',
				source: './source.ts',
				target: './out.ts',
				transformer: './transformers/bad.ts',
			},
		]);

		try {
			execSync(`node ${CLI} sync`, {
				cwd: TEST_DIR,
				encoding: 'utf-8',
				stdio: 'pipe',
			});
		} catch {
			// CLI exits with code 1 on error — expected
		}
		const output = readTarget('out.ts');
		expect(output).toContain('MESH-SYNC SYNC FAILED');
	});

	it('preserves stale content when transformer fails on existing target', () => {
		// Write a pre-existing target
		fs.writeFileSync(path.join(TEST_DIR, 'out.ts'), 'const previous = true;');
		fs.writeFileSync(path.join(TEST_DIR, 'source.ts'), 'hello');
		fs.writeFileSync(
			path.join(TEST_DIR, 'transformers', 'bad.ts'),
			`const t = (s: string) => { throw new Error('stale-boom'); };
export default t;`,
		);
		writeConfig([
			{
				id: 'err-stale',
				source: './source.ts',
				target: './out.ts',
				transformer: './transformers/bad.ts',
			},
		]);

		try {
			execSync(`node ${CLI} sync`, {
				cwd: TEST_DIR,
				encoding: 'utf-8',
				stdio: 'pipe',
			});
		} catch {
			// CLI exits with code 1 on error — expected
		}
		const output = readTarget('out.ts');
		expect(output).toContain('MESH-SYNC SYNC FAILED');
		expect(output).toContain('const previous = true;');
	});

	it('exits with code 1 and shows error when config is missing', () => {
		// Do NOT write a mesh.json
		try {
			execSync(`node ${CLI} sync`, {
				cwd: TEST_DIR,
				encoding: 'utf-8',
				stdio: 'pipe',
			});
			expect.unreachable('should have thrown');
		} catch (err: unknown) {
			const error = err as { stderr: string; status: number };
			expect(error.status).toBe(1);
			expect(error.stderr).toContain('Config file not found');
		}
	});

	it('reports error status when source file does not exist', () => {
		writeConfig([
			{
				id: 'missing-src',
				source: './nonexistent.ts',
				target: './out.ts',
			},
		]);

		let output: string;
		try {
			output = execSync(`node ${CLI} sync --json`, {
				cwd: TEST_DIR,
				encoding: 'utf-8',
				stdio: 'pipe',
			});
		} catch (err: unknown) {
			output = (err as { stdout: string }).stdout || '';
		}
		const parsed = JSON.parse(output);
		expect(parsed.results).toHaveLength(1);
		expect(parsed.results[0].id).toBe('missing-src');
		expect(parsed.results[0].status).toBe('error');
	});

	it('exits with code 1 when mesh.json contains invalid JSON', () => {
		fs.writeFileSync(
			path.join(TEST_DIR, 'mesh.json'),
			'{ this is not valid json !!!',
		);

		try {
			execSync(`node ${CLI} sync`, {
				cwd: TEST_DIR,
				encoding: 'utf-8',
				stdio: 'pipe',
			});
			expect.unreachable('should have thrown');
		} catch (err: unknown) {
			const error = err as { status: number };
			expect(error.status).toBe(1);
		}
	});
});
