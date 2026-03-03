import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	return source
		.split('\n')
		.map((line) => {
			const trimmed = line.trimStart();

			// Remove export default lines entirely
			if (/^export\s+default\b/.test(trimmed)) {
				return null;
			}

			// Remove named export blocks: export { ... }
			if (/^export\s*\{/.test(trimmed)) {
				return null;
			}

			// Strip export from type declarations
			if (/^export\s+type\b/.test(trimmed)) {
				return line.replace(/^(\s*)export\s+/, '$1');
			}

			// Strip export from interface declarations
			if (/^export\s+interface\b/.test(trimmed)) {
				return line.replace(/^(\s*)export\s+/, '$1');
			}

			// Strip export from function/const/let/var/class/enum/async
			if (
				/^export\s+(function|const|let|var|class|enum|async|abstract)\b/.test(
					trimmed,
				)
			) {
				return line.replace(/^(\s*)export\s+/, '$1');
			}

			return line;
		})
		.filter((line): line is string => line !== null)
		.join('\n');
};

export default transform;
