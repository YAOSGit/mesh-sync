import type { Transformer } from '../types/Transformer/index.js';

function toPascalCase(str: string): string {
	return str
		.split(/[-_\s]+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join('');
}

const transform: Transformer = (source, context) => {
	const name = toPascalCase(context.sourceId);
	const indented = source
		.split('\n')
		.map((line) => (line ? `\t${line}` : line))
		.join('\n');

	return `export namespace ${name} {\n${indented}\n}\n`;
};
export default transform;
