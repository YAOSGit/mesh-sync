import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const lines = source.split('\n');
	const result: string[] = [];
	let braceDepth = 0;
	let capturing = false;

	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trimStart();

		// Keep import type statements
		if (/^import\s+type\b/.test(trimmed)) {
			result.push(lines[i]);
			continue;
		}

		// If we are inside a captured block, keep collecting lines
		if (capturing) {
			result.push(lines[i]);
			braceDepth += countChar(lines[i], '{') - countChar(lines[i], '}');
			if (braceDepth <= 0) {
				capturing = false;
				braceDepth = 0;
			}
			continue;
		}

		// Detect type/interface/enum declarations (with or without export)
		if (/^(export\s+)?(type|interface|enum)\b/.test(trimmed)) {
			result.push(lines[i]);
			braceDepth += countChar(lines[i], '{') - countChar(lines[i], '}');
			if (braceDepth > 0) {
				capturing = true;
			}
		}
	}

	return result.join('\n');
};

function countChar(str: string, ch: string): number {
	let count = 0;
	for (const c of str) {
		if (c === ch) count++;
	}
	return count;
}

export default transform;
