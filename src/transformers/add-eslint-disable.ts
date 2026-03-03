import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	if (source.startsWith('/* eslint-disable */')) {
		return source;
	}

	return `/* eslint-disable */\n${source}`;
};
export default transform;
