import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	// Remove JSDoc blocks: /** ... */
	// We match only blocks starting with /** (not /*)
	return source.replace(/\/\*\*[\s\S]*?\*\/\n?/g, '');
};

export default transform;
