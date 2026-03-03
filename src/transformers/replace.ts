import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const pattern = process.env.MESH_SYNC_REPLACE_PATTERN;

	if (!pattern) {
		return source;
	}

	const replacement = process.env.MESH_SYNC_REPLACE_WITH ?? '';

	return source.replace(new RegExp(pattern, 'g'), replacement);
};
export default transform;
