import { describe, expect, it } from 'vitest';
import { generateDiff } from './index.js';

describe('generateDiff', () => {
	it('shows no changes for identical content', () => {
		const diff = generateDiff('a\nb\nc', 'a\nb\nc');
		expect(diff).toBe(' a\n b\n c');
	});

	it('shows additions', () => {
		const diff = generateDiff('a\nc', 'a\nb\nc');
		expect(diff).toContain('+b');
		expect(diff).toContain(' a');
		expect(diff).toContain(' c');
	});

	it('shows removals', () => {
		const diff = generateDiff('a\nb\nc', 'a\nc');
		expect(diff).toContain('-b');
		expect(diff).toContain(' a');
		expect(diff).toContain(' c');
	});

	it('shows mixed changes', () => {
		const diff = generateDiff('a\nb\nc', 'a\nx\nc');
		expect(diff).toContain('-b');
		expect(diff).toContain('+x');
		expect(diff).toContain(' a');
		expect(diff).toContain(' c');
	});

	it('handles empty old content', () => {
		const diff = generateDiff('', 'a\nb');
		expect(diff).toContain('+a');
		expect(diff).toContain('+b');
	});

	it('handles empty new content', () => {
		const diff = generateDiff('a\nb', '');
		expect(diff).toContain('-a');
		expect(diff).toContain('-b');
	});
});
