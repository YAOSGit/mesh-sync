import type { Transformer } from '../types/Transformer/index.js';

function toCamelCase(str: string): string {
	return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

const transform: Transformer = (source, context) => {
	const data = JSON.parse(source);
	const varName = toCamelCase(context.sourceId);
	const formatted = JSON.stringify(data, null, '\t');

	return `export const ${varName} = ${formatted} as const;\n`;
};
export default transform;
