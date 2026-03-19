import { rootConfig } from '@yaos-git/toolkit/build';

const config = rootConfig();

export default {
	...config,
	test: {
		...config.test,
		projects: [
			'./vitest.unit.config.ts',
			'./vitest.type.config.ts',
			'./vitest.e2e.config.ts',
		],
	},
};
