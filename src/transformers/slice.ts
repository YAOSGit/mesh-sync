import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const startMarker = '// mesh-sync:start';
	const endMarker = '// mesh-sync:end';
	const lines = source.split('\n');
	const slices: string[] = [];
	let inside = false;
	let currentSlice: string[] = [];

	for (const line of lines) {
		if (line.trim() === startMarker) {
			inside = true;
			currentSlice = [];
			continue;
		}
		if (line.trim() === endMarker) {
			if (inside) {
				slices.push(currentSlice.join('\n'));
			}
			inside = false;
			continue;
		}
		if (inside) {
			currentSlice.push(line);
		}
	}

	if (slices.length === 0) {
		return source;
	}

	return slices.join('\n');
};
export default transform;
