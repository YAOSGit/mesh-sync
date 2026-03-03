import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const hasTrailingNewline = source.endsWith('\n');
	const lines = source.split('\n');

	if (hasTrailingNewline && lines[lines.length - 1] === '') {
		lines.pop();
	}

	const seen = new Set<string>();
	const unique: string[] = [];

	for (const line of lines) {
		if (!seen.has(line)) {
			seen.add(line);
			unique.push(line);
		}
	}

	return unique.join('\n') + (hasTrailingNewline ? '\n' : '');
};
export default transform;
