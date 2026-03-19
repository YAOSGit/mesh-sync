import { describe, expect, it } from 'vitest';
import { countChar } from './countChar.js';

describe('countChar', () => {
	it('counts occurrences of a character in a string', () => {
		expect(countChar('hello', 'l')).toBe(2);
	});

	it('returns 0 when character is not found', () => {
		expect(countChar('hello', 'z')).toBe(0);
	});

	it('returns 0 for an empty string', () => {
		expect(countChar('', 'a')).toBe(0);
	});

	it('counts all characters when entire string is the same character', () => {
		expect(countChar('aaaa', 'a')).toBe(4);
	});

	it('counts spaces', () => {
		expect(countChar('a b c d', ' ')).toBe(3);
	});

	it('counts newlines', () => {
		expect(countChar('line1\nline2\nline3', '\n')).toBe(2);
	});

	it('counts tabs', () => {
		expect(countChar('\t\thello\t', '\t')).toBe(3);
	});

	it('is case-sensitive', () => {
		expect(countChar('AaAa', 'a')).toBe(2);
		expect(countChar('AaAa', 'A')).toBe(2);
	});

	it('handles unicode characters', () => {
		expect(countChar('cafe\u0301', 'e')).toBe(1);
	});

	it('handles single character string', () => {
		expect(countChar('x', 'x')).toBe(1);
		expect(countChar('x', 'y')).toBe(0);
	});

	it('handles special regex characters as search char', () => {
		expect(countChar('a.b.c', '.')).toBe(2);
		expect(countChar('a*b*c', '*')).toBe(2);
		expect(countChar('(a)(b)', '(')).toBe(2);
	});
});
