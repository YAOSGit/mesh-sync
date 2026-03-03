import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const prefix = process.env.MESH_SYNC_WRAP_PREFIX ?? '';
	const suffix = process.env.MESH_SYNC_WRAP_SUFFIX ?? '';

	return prefix + source + suffix;
};
export default transform;
