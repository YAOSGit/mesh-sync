import { describe, expect, it } from 'vitest';
import { parseInterval } from './index.js';

describe('parseInterval', () => {
	it('parses seconds', () => {
		expect(parseInterval('30s')).toBe(30_000);
	});

	it('parses minutes', () => {
		expect(parseInterval('5m')).toBe(300_000);
	});

	it('parses hours', () => {
		expect(parseInterval('1h')).toBe(3_600_000);
	});

	it('throws on invalid format', () => {
		expect(() => parseInterval('abc')).toThrow(/invalid interval/i);
	});

	it('throws on zero value', () => {
		expect(() => parseInterval('0m')).toThrow(/must be greater than zero/i);
	});

	it('throws on negative value', () => {
		expect(() => parseInterval('-5m')).toThrow(/invalid interval/i);
	});
});
