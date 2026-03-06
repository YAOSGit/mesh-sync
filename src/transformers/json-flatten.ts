import type { Transformer } from '../types/Transformer/index.js';

function flatten(
	obj: unknown,
	prefix: string,
	result: Record<string, unknown>,
): void {
	if (Array.isArray(obj)) {
		for (let i = 0; i < obj.length; i++) {
			const key = prefix === '' ? String(i) : `${prefix}.${i}`;
			flatten(obj[i], key, result);
		}
	} else if (typeof obj === 'object' && obj !== null) {
		for (const [k, v] of Object.entries(obj)) {
			const key = prefix === '' ? k : `${prefix}.${k}`;
			flatten(v, key, result);
		}
	} else {
		result[prefix] = obj;
	}
}

const transform: Transformer = (source) => {
	const data = JSON.parse(source);
	const result: Record<string, unknown> = {};
	flatten(data, '', result);
	return `${JSON.stringify(result, null, '\t')}\n`;
};
export default transform;
