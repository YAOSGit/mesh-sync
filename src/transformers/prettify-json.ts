import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	try {
		return `${JSON.stringify(JSON.parse(source), null, '\t')}\n`;
	} catch {
		return source;
	}
};
export default transform;
