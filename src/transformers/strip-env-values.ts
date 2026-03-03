import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const lines = source.split('\n');
	const result = lines.map((line) => {
		// Keep empty lines
		if (line.trim() === '') return line;
		// Keep comments
		if (line.trimStart().startsWith('#')) return line;
		// Strip value from KEY=value lines
		const eqIndex = line.indexOf('=');
		if (eqIndex !== -1) {
			const key = line.substring(0, eqIndex);
			return `${key}=`;
		}
		// Return line as-is if it doesn't match any pattern
		return line;
	});
	return result.join('\n');
};
export default transform;
