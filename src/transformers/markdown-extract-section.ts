import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const section = process.env.MESH_SYNC_SECTION;
	const lines = source.split('\n');

	let startIndex = -1;
	let headingLevel = 0;

	if (section) {
		for (let i = 0; i < lines.length; i++) {
			const match = lines[i].match(/^(#{1,6})\s+(.*)/);
			if (match && match[2].trim() === section) {
				startIndex = i;
				headingLevel = match[1].length;
				break;
			}
		}
	} else {
		for (let i = 0; i < lines.length; i++) {
			const match = lines[i].match(/^(##)\s+(.*)/);
			if (match) {
				startIndex = i;
				headingLevel = match[1].length;
				break;
			}
		}
	}

	if (startIndex === -1) {
		return '<!-- section not found -->';
	}

	let endIndex = lines.length;
	for (let i = startIndex + 1; i < lines.length; i++) {
		const match = lines[i].match(/^(#{1,6})\s+/);
		if (match && match[1].length <= headingLevel) {
			endIndex = i;
			break;
		}
	}

	return lines.slice(startIndex, endIndex).join('\n').trimEnd();
};
export default transform;
