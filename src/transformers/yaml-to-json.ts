import type { Transformer } from '../types/Transformer/index.js';

function parseYaml(source: string): unknown {
	const lines = source.split('\n');
	let i = 0;

	function parseLine(line: string): {
		indent: number;
		key?: string;
		value?: string;
		isArrayItem: boolean;
		raw: string;
	} {
		const raw = line;
		const stripped = line.replace(/\s+$/, '');
		const indent = stripped.search(/\S/);
		if (indent === -1) return { indent: -1, isArrayItem: false, raw };

		const content = stripped.slice(indent);

		// Comment
		if (content.startsWith('#')) return { indent: -1, isArrayItem: false, raw };

		// Array item
		if (content.startsWith('- ')) {
			const rest = content.slice(2);
			const colonIdx = rest.indexOf(': ');
			if (colonIdx !== -1) {
				return {
					indent,
					key: rest.slice(0, colonIdx),
					value: rest.slice(colonIdx + 2),
					isArrayItem: true,
					raw,
				};
			}
			return { indent, value: rest, isArrayItem: true, raw };
		}

		// Key-value
		const colonIdx = content.indexOf(': ');
		if (colonIdx !== -1) {
			return {
				indent,
				key: content.slice(0, colonIdx),
				value: content.slice(colonIdx + 2),
				isArrayItem: false,
				raw,
			};
		}

		// Key with no value (nested object follows)
		if (content.endsWith(':')) {
			return { indent, key: content.slice(0, -1), isArrayItem: false, raw };
		}

		return { indent, value: content, isArrayItem: false, raw };
	}

	function parseValue(val: string): unknown {
		if (val === undefined || val === '') return '';
		const trimmed = val.trim();

		// Remove inline comments
		let cleaned = trimmed;
		const commentMatch = cleaned.match(/^(["'].*?["'])\s+#.*$/);
		if (commentMatch) {
			cleaned = commentMatch[1];
		} else if (!cleaned.startsWith('"') && !cleaned.startsWith("'")) {
			const hashIdx = cleaned.indexOf(' #');
			if (hashIdx !== -1) {
				cleaned = cleaned.slice(0, hashIdx).trim();
			}
		}

		// Quoted strings
		if (
			(cleaned.startsWith('"') && cleaned.endsWith('"')) ||
			(cleaned.startsWith("'") && cleaned.endsWith("'"))
		) {
			return cleaned.slice(1, -1);
		}

		// Booleans
		if (cleaned === 'true') return true;
		if (cleaned === 'false') return false;

		// Null
		if (cleaned === 'null' || cleaned === '~') return null;

		// Numbers
		if (/^-?\d+(\.\d+)?$/.test(cleaned)) return Number(cleaned);

		return cleaned;
	}

	function parseBlock(baseIndent: number): unknown {
		// Peek at first meaningful line to determine if array or object
		const firstIdx = findNextMeaningful(i);
		if (firstIdx === -1) return {};

		const first = parseLine(lines[firstIdx]);
		if (first.isArrayItem) {
			return parseArray(baseIndent);
		}
		return parseObject(baseIndent);
	}

	function findNextMeaningful(from: number): number {
		for (let j = from; j < lines.length; j++) {
			const p = parseLine(lines[j]);
			if (p.indent !== -1) return j;
		}
		return -1;
	}

	function parseObject(baseIndent: number): Record<string, unknown> {
		const obj: Record<string, unknown> = {};

		while (i < lines.length) {
			const nextIdx = findNextMeaningful(i);
			if (nextIdx === -1) break;

			const parsed = parseLine(lines[nextIdx]);
			if (parsed.indent < baseIndent) break;
			if (parsed.indent !== baseIndent) break;

			i = nextIdx + 1;

			if (parsed.key !== undefined) {
				if (parsed.value !== undefined && parsed.value !== '') {
					obj[parsed.key] = parseValue(parsed.value);
				} else {
					// Check if next line has greater indent
					const nextMeaningful = findNextMeaningful(i);
					if (nextMeaningful !== -1) {
						const nextParsed = parseLine(lines[nextMeaningful]);
						if (nextParsed.indent > baseIndent) {
							obj[parsed.key] = parseBlock(nextParsed.indent);
						} else {
							obj[parsed.key] = null;
						}
					} else {
						obj[parsed.key] = null;
					}
				}
			}
		}

		return obj;
	}

	function parseArray(baseIndent: number): unknown[] {
		const arr: unknown[] = [];

		while (i < lines.length) {
			const nextIdx = findNextMeaningful(i);
			if (nextIdx === -1) break;

			const parsed = parseLine(lines[nextIdx]);
			if (parsed.indent < baseIndent) break;
			if (parsed.indent !== baseIndent) break;
			if (!parsed.isArrayItem) break;

			i = nextIdx + 1;

			if (parsed.key !== undefined) {
				// Array item is an object
				const item: Record<string, unknown> = {};
				item[parsed.key] = parseValue(parsed.value ?? '');
				// Check for more keys at deeper indent
				const nextMeaningful = findNextMeaningful(i);
				if (nextMeaningful !== -1) {
					const nextParsed = parseLine(lines[nextMeaningful]);
					if (nextParsed.indent > baseIndent && !nextParsed.isArrayItem) {
						const rest = parseObject(nextParsed.indent) as Record<
							string,
							unknown
						>;
						Object.assign(item, rest);
					}
				}
				arr.push(item);
			} else {
				arr.push(parseValue(parsed.value ?? ''));
			}
		}

		return arr;
	}

	return parseBlock(0);
}

const transform: Transformer = (source) => {
	const result = parseYaml(source);
	return JSON.stringify(result, null, 2);
};
export default transform;
