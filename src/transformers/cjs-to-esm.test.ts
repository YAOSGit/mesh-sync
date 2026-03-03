import { describe, expect, it } from 'vitest';
import transform from './cjs-to-esm.js';

describe('cjs-to-esm transformer', () => {
	it('converts const x = require("module") to import', () => {
		const input = "const fs = require('fs')";
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe("import fs from 'fs'");
	});

	it('converts destructured require to named import', () => {
		const input = "const { readFile, writeFile } = require('fs')";
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe("import { readFile, writeFile } from 'fs'");
	});

	it('converts module.exports = x to export default', () => {
		const input = 'module.exports = myFunction';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('export default myFunction');
	});

	it('converts module.exports.foo = bar to named export', () => {
		const input = 'module.exports.helper = helperFn';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('export const helper = helperFn');
	});

	it('converts exports.foo = bar to named export', () => {
		const input = 'exports.util = utilFn';
		const result = transform(input, {
			sourceId: 't',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toBe('export const util = utilFn');
	});
});
