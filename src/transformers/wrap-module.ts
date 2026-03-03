import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source, context) => {
	const indented = source
		.split('\n')
		.map((line) => (line ? `\t${line}` : line))
		.join('\n');

	return `declare module '${context.sourceId}' {\n${indented}\n}\n`;
};
export default transform;
