import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const prefix = process.env.MESH_SYNC_ENV_PREFIX ?? 'PUBLIC_';
	const lines = source.split('\n');
	const filtered = lines.filter((line) => {
		const trimmed = line.trim();
		if (trimmed === '' || trimmed.startsWith('#')) return false;
		const eqIndex = trimmed.indexOf('=');
		if (eqIndex === -1) return false;
		const key = trimmed.slice(0, eqIndex);
		return key.startsWith(prefix);
	});
	return `${filtered.join('\n')}\n`;
};
export default transform;
