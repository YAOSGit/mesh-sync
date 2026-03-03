import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const lines = source.split('\n');
	const entries: string[] = [];
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed === '' || trimmed.startsWith('#')) continue;
		const eqIndex = trimmed.indexOf('=');
		if (eqIndex === -1) continue;
		entries.push(`  - ${trimmed}`);
	}
	if (entries.length === 0) return 'environment:\n';
	return `environment:\n${entries.join('\n')}\n`;
};
export default transform;
