import { afterEach, describe, expect, it } from 'vitest';
import transform from './rename-exports.js';

describe('rename-exports transformer', () => {
	afterEach(() => {
		delete process.env.MESH_SYNC_RENAME_MAP;
	});

	it('returns source unchanged when env var is not set', () => {
		const input = 'export function oldName() {}';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe(input);
	});

	it('renames export function names', () => {
		process.env.MESH_SYNC_RENAME_MAP = JSON.stringify({ oldName: 'newName' });
		const input = 'export function oldName() {}';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('export function newName() {}');
	});

	it('renames export const, type, interface, class, enum', () => {
		process.env.MESH_SYNC_RENAME_MAP = JSON.stringify({ Foo: 'Bar' });
		const input = [
			'export const Foo = 1;',
			'export type Foo = string;',
			'export interface Foo {}',
			'export class Foo {}',
			'export enum Foo {}',
		].join('\n');
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).not.toContain('Foo');
		expect(result).toContain('export const Bar = 1;');
		expect(result).toContain('export type Bar = string;');
		expect(result).toContain('export interface Bar {}');
		expect(result).toContain('export class Bar {}');
		expect(result).toContain('export enum Bar {}');
	});

	it('renames names in export { ... } blocks', () => {
		process.env.MESH_SYNC_RENAME_MAP = JSON.stringify({ oldName: 'newName' });
		const input = 'export { oldName }';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('export { newName }');
	});

	it('handles multiple rename entries', () => {
		process.env.MESH_SYNC_RENAME_MAP = JSON.stringify({
			Foo: 'Bar',
			Baz: 'Qux',
		});
		const input = 'export const Foo = 1;\nexport type Baz = string;';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('export const Bar = 1;');
		expect(result).toContain('export type Qux = string;');
	});
});
