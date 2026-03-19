import { assertType, describe, expectTypeOf, it } from 'vitest';
import { DEFAULT_TIMEOUT } from './engine.consts.js';

describe('engine constants', () => {
	it('DEFAULT_TIMEOUT is a number', () => {
		expectTypeOf(DEFAULT_TIMEOUT).toEqualTypeOf<number>();
	});

	it('DEFAULT_TIMEOUT is assignable to number', () => {
		assertType<number>(DEFAULT_TIMEOUT);
	});
});
