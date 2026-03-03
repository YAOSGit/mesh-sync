import { describe, expectTypeOf, it } from 'vitest';
import type { SyncEntry } from '../Sync/index.js';
import type { TransformContext, Transformer } from '../Transformer/index.js';
import type { Config } from './index.js';

describe('Config types', () => {
	it('Config has syncs array', () => {
		expectTypeOf<Config>().toHaveProperty('syncs');
		expectTypeOf<Config['syncs']>().toEqualTypeOf<SyncEntry[]>();
	});

	it('SyncEntry transformer is optional and accepts string or array', () => {
		expectTypeOf<SyncEntry['transformer']>().toEqualTypeOf<
			string | string[] | undefined
		>();
	});

	it('Transformer accepts source and context, returns string or promise', () => {
		expectTypeOf<Transformer>().toBeFunction();
		expectTypeOf<Transformer>().parameters.toEqualTypeOf<
			[string, TransformContext]
		>();
	});
});
