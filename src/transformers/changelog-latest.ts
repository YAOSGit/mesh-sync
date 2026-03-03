import type { Transformer } from '../types/Transformer/index.js';

const VERSION_HEADING = /^##\s+\[?\d+\.\d+(?:\.\d+)?(?:-[\w.]+)?\]?/;

const transform: Transformer = (source) => {
	const lines = source.split('\n');

	let startIndex = -1;
	for (let i = 0; i < lines.length; i++) {
		if (VERSION_HEADING.test(lines[i])) {
			startIndex = i;
			break;
		}
	}

	if (startIndex === -1) {
		return source;
	}

	let endIndex = lines.length;
	for (let i = startIndex + 1; i < lines.length; i++) {
		if (VERSION_HEADING.test(lines[i])) {
			endIndex = i;
			break;
		}
	}

	return lines.slice(startIndex, endIndex).join('\n');
};
export default transform;
