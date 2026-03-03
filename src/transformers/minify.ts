import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	try {
		return JSON.stringify(JSON.parse(source));
	} catch {
		// Not valid JSON — apply text minification
		return source
			.split('\n')
			.map((line) => line.trim())
			.join('\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}
};
export default transform;
