import type { Transformer } from '../types/Transformer/index.js';

const TEST_IMPORT_RE =
	/^import\s+\{[^}]*\}\s+from\s+['"](?:vitest|jest|@jest\/globals|node:test|bun:test)['"]\s*;?\s*$/;

const TEST_BLOCK_RE =
	/^(describe|it|test|beforeEach|afterEach|beforeAll|afterAll)\s*\(/;

const transform: Transformer = (source) => {
	const lines = source.split('\n');
	const result: string[] = [];
	let parenDepth = 0;
	let braceDepth = 0;
	let skipping = false;

	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trimStart();

		// Remove test framework imports
		if (TEST_IMPORT_RE.test(trimmed)) {
			continue;
		}

		// If currently skipping a test block, track braces
		if (skipping) {
			for (const ch of lines[i]) {
				if (ch === '(') parenDepth++;
				if (ch === ')') parenDepth--;
				if (ch === '{') braceDepth++;
				if (ch === '}') braceDepth--;
			}
			if (parenDepth <= 0 && braceDepth <= 0) {
				skipping = false;
				parenDepth = 0;
				braceDepth = 0;
			}
			continue;
		}

		// Detect test block starts
		if (TEST_BLOCK_RE.test(trimmed)) {
			skipping = true;
			parenDepth = 0;
			braceDepth = 0;
			for (const ch of lines[i]) {
				if (ch === '(') parenDepth++;
				if (ch === ')') parenDepth--;
				if (ch === '{') braceDepth++;
				if (ch === '}') braceDepth--;
			}
			if (parenDepth <= 0 && braceDepth <= 0) {
				skipping = false;
			}
			continue;
		}

		result.push(lines[i]);
	}

	return result.join('\n');
};

export default transform;
