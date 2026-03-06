import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const keysEnv = process.env.MESH_SYNC_PICK;
	if (!keysEnv) return source;

	const keys = keysEnv.split(',').map((k) => k.trim());
	const data = JSON.parse(source);
	const picked: Record<string, unknown> = {};
	for (const key of keys) {
		if (key in data) {
			picked[key] = data[key];
		}
	}
	return `${JSON.stringify(picked, null, '\t')}\n`;
};
export default transform;
