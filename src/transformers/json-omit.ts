import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const keysEnv = process.env.MESH_SYNC_OMIT;
	if (!keysEnv) return source;

	const keys = new Set(keysEnv.split(',').map((k) => k.trim()));
	const data = JSON.parse(source) as Record<string, unknown>;
	const result: Record<string, unknown> = {};
	for (const key of Object.keys(data)) {
		if (!keys.has(key)) {
			result[key] = data[key];
		}
	}
	return `${JSON.stringify(result, null, 2)}\n`;
};
export default transform;
