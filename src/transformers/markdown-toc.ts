import type { Transformer } from '../types/Transformer/index.js';

const toAnchor = (text: string): string => {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-');
};

const transform: Transformer = (source) => {
	const lines = source.split('\n');
	const tocEntries: string[] = [];

	for (const line of lines) {
		const match = line.match(/^(#{1,6})\s+(.*)/);
		if (match) {
			const level = match[1].length;
			const text = match[2].trim();
			const anchor = toAnchor(text);
			const indent = '  '.repeat(level - 1);
			tocEntries.push(`${indent}- [${text}](#${anchor})`);
		}
	}

	if (tocEntries.length === 0) {
		return source;
	}

	const toc = `## Table of Contents\n\n${tocEntries.join('\n')}`;
	return `${toc}\n\n${source}`;
};
export default transform;
