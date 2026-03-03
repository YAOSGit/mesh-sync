import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const hasTrailingNewline = source.endsWith('\n');
	const lines = source.split('\n');

	if (hasTrailingNewline && lines[lines.length - 1] === '') {
		lines.pop();
	}

	lines.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

	return lines.join('\n') + (hasTrailingNewline ? '\n' : '');
};
export default transform;
