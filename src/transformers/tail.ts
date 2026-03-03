import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const maxLines = parseInt(process.env.MESH_SYNC_LINES ?? '20', 10);
	const lines = source.split('\n');

	return lines.slice(-maxLines).join('\n');
};
export default transform;
