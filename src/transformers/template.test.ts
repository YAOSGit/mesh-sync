import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import transform from './template.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('template transformer', () => {
	const savedEnv: Record<string, string | undefined> = {};

	beforeEach(() => {
		savedEnv.APP_NAME = process.env.APP_NAME;
		savedEnv.VERSION = process.env.VERSION;
		savedEnv.MISSING_VAR = process.env.MISSING_VAR;
		process.env.APP_NAME = 'my-app';
		process.env.VERSION = '2.0.0';
		delete process.env.MISSING_VAR;
	});

	afterEach(() => {
		for (const [key, val] of Object.entries(savedEnv)) {
			if (val !== undefined) {
				process.env[key] = val;
			} else {
				delete process.env[key];
			}
		}
	});

	it('replaces {{KEY}} with env var value', () => {
		const input = 'name: {{APP_NAME}}, version: {{VERSION}}';
		const result = transform(input, ctx);
		expect(result).toBe('name: my-app, version: 2.0.0');
	});

	it('leaves placeholder as-is when env var does not exist', () => {
		const input = 'value: {{MISSING_VAR}}';
		const result = transform(input, ctx);
		expect(result).toBe('value: {{MISSING_VAR}}');
	});

	it('handles {{ KEY }} with spaces inside braces', () => {
		const input = 'app={{ APP_NAME }}';
		const result = transform(input, ctx);
		expect(result).toBe('app=my-app');
	});

	it('handles multiple occurrences of the same variable', () => {
		const input = '{{APP_NAME}} and {{APP_NAME}}';
		const result = transform(input, ctx);
		expect(result).toBe('my-app and my-app');
	});

	it('returns unchanged text when no placeholders exist', () => {
		const input = 'no placeholders here';
		const result = transform(input, ctx);
		expect(result).toBe('no placeholders here');
	});
});
