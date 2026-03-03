import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	return source
		.replace(/\/\/\s*@internal.*\n?/g, '')
		.replace(/\/\*\*\s*@private[\s\S]*?\*\/\n?/g, '');
};
export default transform;
