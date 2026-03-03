import { describe, expect, it } from 'vitest';
import { hashContent } from './index.js';

describe('hashContent', () => {
	it('returns a hex string', () => {
		const hash = hashContent('hello');
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
	});

	it('is deterministic', () => {
		expect(hashContent('hello')).toBe(hashContent('hello'));
	});

	it('differs for different inputs', () => {
		expect(hashContent('hello')).not.toBe(hashContent('world'));
	});
});
