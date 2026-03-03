import type { Transformer } from '../types/Transformer/index.js';

function markdownToHtml(source: string): string {
	const lines = source.split('\n');
	const output: string[] = [];
	let i = 0;

	function processInline(text: string): string {
		let result = text;

		// Images (must come before links)
		result = result.replace(
			/!\[([^\]]*)\]\(([^)]+)\)/g,
			'<img src="$2" alt="$1" />',
		);

		// Links
		result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

		// Bold
		result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

		// Italic
		result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');

		// Inline code
		result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

		return result;
	}

	while (i < lines.length) {
		const line = lines[i];

		// Empty line
		if (line.trim() === '') {
			i++;
			continue;
		}

		// Code block
		if (line.trim().startsWith('```')) {
			i++;
			const codeLines: string[] = [];
			while (i < lines.length && !lines[i].trim().startsWith('```')) {
				codeLines.push(lines[i]);
				i++;
			}
			if (i < lines.length) i++; // Skip closing ```
			output.push(`<pre><code>${codeLines.join('\n')}</code></pre>`);
			continue;
		}

		// Horizontal rule
		if (/^---+$/.test(line.trim())) {
			output.push('<hr />');
			i++;
			continue;
		}

		// Headings
		const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			const text = processInline(headingMatch[2]);
			output.push(`<h${level}>${text}</h${level}>`);
			i++;
			continue;
		}

		// Unordered list
		if (/^\s*- /.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*- /.test(lines[i])) {
				const itemText = lines[i].replace(/^\s*- /, '');
				items.push(`<li>${processInline(itemText)}</li>`);
				i++;
			}
			output.push(`<ul>${items.join('')}</ul>`);
			continue;
		}

		// Ordered list
		if (/^\s*\d+\.\s/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
				const itemText = lines[i].replace(/^\s*\d+\.\s/, '');
				items.push(`<li>${processInline(itemText)}</li>`);
				i++;
			}
			output.push(`<ol>${items.join('')}</ol>`);
			continue;
		}

		// Paragraph - collect consecutive non-empty, non-special lines
		const paraLines: string[] = [];
		while (
			i < lines.length &&
			lines[i].trim() !== '' &&
			!lines[i].trim().startsWith('#') &&
			!lines[i].trim().startsWith('```') &&
			!/^\s*- /.test(lines[i]) &&
			!/^\s*\d+\.\s/.test(lines[i]) &&
			!/^---+$/.test(lines[i].trim())
		) {
			paraLines.push(lines[i]);
			i++;
		}
		if (paraLines.length > 0) {
			output.push(`<p>${processInline(paraLines.join(' '))}</p>`);
		}
	}

	return output.join('\n');
}

const transform: Transformer = (source) => {
	return markdownToHtml(source);
};
export default transform;
