import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	let result = source;

	// Remove fenced code block markers (``` or ```lang)
	result = result.replace(/^```[\w]*$/gm, '');

	// Remove images: ![alt](url) → alt
	result = result.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');

	// Convert links: [text](url) → text
	result = result.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

	// Remove heading markers
	result = result.replace(/^#{1,6}\s+/gm, '');

	// Remove horizontal rules
	result = result.replace(/^(\*{3,}|-{3,}|_{3,})\s*$/gm, '');

	// Remove bold/italic markers (order matters: bold first, then italic)
	result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
	result = result.replace(/__([^_]+)__/g, '$1');
	result = result.replace(/\*([^*]+)\*/g, '$1');
	result = result.replace(/_([^_]+)_/g, '$1');

	// Remove inline code markers
	result = result.replace(/`([^`]+)`/g, '$1');

	// Remove blockquote markers
	result = result.replace(/^>\s?/gm, '');

	// Remove unordered list markers (-, *, +)
	result = result.replace(/^[\t ]*[-*+]\s+/gm, '');

	// Remove ordered list markers (1., 2., etc.)
	result = result.replace(/^[\t ]*\d+\.\s+/gm, '');

	// Remove HTML tags
	result = result.replace(/<[^>]+>/g, '');

	// Collapse multiple blank lines
	result = result.replace(/\n{3,}/g, '\n\n');

	return result.trim();
};
export default transform;
