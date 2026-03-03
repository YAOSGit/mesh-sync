import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const lines = source.split('\n');
	const result: string[] = [];
	let inMultiLineImport = false;

	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trimStart();

		// If we are inside a multi-line import, skip until the closing line
		if (inMultiLineImport) {
			if (/from\s+['"]/.test(lines[i]) || /['"].*['"];?\s*$/.test(trimmed)) {
				inMultiLineImport = false;
			}
			continue;
		}

		// Single-line import: import ... from '...'
		if (/^import\s+.*from\s+['"]/.test(trimmed)) {
			continue;
		}

		// Side-effect import: import '...'
		if (/^import\s+['"]/.test(trimmed)) {
			continue;
		}

		// import type statements
		if (/^import\s+type\b/.test(trimmed)) {
			continue;
		}

		// Multi-line import start (has import but no from on same line)
		if (/^import\s+\{/.test(trimmed) && !/from\s+['"]/.test(trimmed)) {
			inMultiLineImport = true;
			continue;
		}

		// require statements: const/let/var x = require('...')
		if (/^(const|let|var)\s+.*=\s*require\s*\(/.test(trimmed)) {
			continue;
		}

		result.push(lines[i]);
	}

	return result.join('\n');
};

export default transform;
