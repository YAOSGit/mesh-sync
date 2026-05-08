import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeErrorMarker, writeTarget } from './writer.js';

const TEST_DIR = path.join(import.meta.dirname, '../../.test-writer');

beforeEach(() => {
	fs.mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
	if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true });
});

describe('writeTarget', () => {
	it('writes content to target file', () => {
		const target = path.join(TEST_DIR, 'out.ts');
		writeTarget(target, 'export const x = 1;');
		expect(fs.readFileSync(target, 'utf-8')).toBe('export const x = 1;');
	});

	it('creates parent directories', () => {
		const target = path.join(TEST_DIR, 'deep/nested/out.ts');
		writeTarget(target, 'content');
		expect(fs.existsSync(target)).toBe(true);
	});

	it('uses atomic write (no partial writes)', () => {
		const target = path.join(TEST_DIR, 'out.ts');
		writeTarget(target, 'first');
		writeTarget(target, 'second');
		expect(fs.readFileSync(target, 'utf-8')).toBe('second');
	});

	it('leaves no temp files on success', () => {
		const target = path.join(TEST_DIR, 'out.ts');
		writeTarget(target, 'content');
		const files = fs.readdirSync(TEST_DIR);
		expect(files).toEqual(['out.ts']);
	});
});

describe('writeErrorMarker', () => {
	it('writes error marker with stale content preserved', () => {
		const target = path.join(TEST_DIR, 'out.ts');
		fs.writeFileSync(target, 'const old = true;');

		writeErrorMarker(target, {
			sourceId: 'test-sync',
			sourcePath: 'https://example.com/api.json',
			error: 'Transformer threw: Cannot read property',
		});

		const markerPath = path.join(TEST_DIR, '.mesh-sync-errors', 'out.ts');
		const content = fs.readFileSync(markerPath, 'utf-8');
		expect(content).toContain('MESH-SYNC SYNC FAILED');
		expect(content).toContain('https://example.com/api.json');
		expect(content).toContain('Cannot read property');
		expect(content).toContain('const old = true;');
	});

	it('writes error marker when no previous content exists', () => {
		const target = path.join(TEST_DIR, 'new.ts');

		writeErrorMarker(target, {
			sourceId: 'test-sync',
			sourcePath: './src.ts',
			error: 'File not found',
		});

		const markerPath = path.join(TEST_DIR, '.mesh-sync-errors', 'new.ts');
		const content = fs.readFileSync(markerPath, 'utf-8');
		expect(content).toContain('MESH-SYNC SYNC FAILED');
		expect(content).toContain('File not found');
		expect(content).not.toContain('STALE OUTPUT');
	});
});
