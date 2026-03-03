import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const maxLines = parseInt(process.env.MESH_SYNC_LINES ?? '50', 10);
	const lines = source.split('\n');

	if (lines.length <= maxLines) {
		return source;
	}

	return `${lines.slice(0, maxLines).join('\n')}\n// ... truncated`;
};
export default transform;
