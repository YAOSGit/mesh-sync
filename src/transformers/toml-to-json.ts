import type { Transformer } from '../types/Transformer/index.js';

function parseToml(source: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const lines = source.split('\n');
	let currentSection: string[] = [];

	function setNested(
		obj: Record<string, unknown>,
		path: string[],
		value: unknown,
	): void {
		let current = obj;
		for (let i = 0; i < path.length - 1; i++) {
			if (
				!(path[i] in current) ||
				typeof current[path[i]] !== 'object' ||
				current[path[i]] === null
			) {
				current[path[i]] = {};
			}
			current = current[path[i]] as Record<string, unknown>;
		}
		current[path[path.length - 1]] = value;
	}

	function getNested(
		obj: Record<string, unknown>,
		path: string[],
	): Record<string, unknown> {
		let current = obj;
		for (const key of path) {
			if (
				!(key in current) ||
				typeof current[key] !== 'object' ||
				current[key] === null
			) {
				current[key] = {};
			}
			current = current[key] as Record<string, unknown>;
		}
		return current;
	}

	function parseTomlValue(val: string): unknown {
		const trimmed = val.trim();

		// String
		if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
			return trimmed
				.slice(1, -1)
				.replace(/\\n/g, '\n')
				.replace(/\\t/g, '\t')
				.replace(/\\"/g, '"')
				.replace(/\\\\/g, '\\');
		}
		if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
			return trimmed.slice(1, -1);
		}

		// Boolean
		if (trimmed === 'true') return true;
		if (trimmed === 'false') return false;

		// Number
		if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

		// Array
		if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
			const inner = trimmed.slice(1, -1).trim();
			if (inner === '') return [];
			return splitArrayValues(inner).map((item) => parseTomlValue(item));
		}

		return trimmed;
	}

	function splitArrayValues(str: string): string[] {
		const values: string[] = [];
		let current = '';
		let depth = 0;
		let inString = false;
		let stringChar = '';

		for (let i = 0; i < str.length; i++) {
			const ch = str[i];

			if (inString) {
				current += ch;
				if (ch === '\\' && i + 1 < str.length) {
					current += str[++i];
					continue;
				}
				if (ch === stringChar) inString = false;
				continue;
			}

			if (ch === '"' || ch === "'") {
				inString = true;
				stringChar = ch;
				current += ch;
			} else if (ch === '[') {
				depth++;
				current += ch;
			} else if (ch === ']') {
				depth--;
				current += ch;
			} else if (ch === ',' && depth === 0) {
				values.push(current.trim());
				current = '';
			} else {
				current += ch;
			}
		}

		if (current.trim()) values.push(current.trim());
		return values;
	}

	for (const line of lines) {
		const trimmed = line.trim();

		// Skip empty lines and comments
		if (trimmed === '' || trimmed.startsWith('#')) continue;

		// Section header
		const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
		if (sectionMatch) {
			currentSection = sectionMatch[1].split('.');
			getNested(result, currentSection);
			continue;
		}

		// Key-value pair
		const eqIdx = trimmed.indexOf('=');
		if (eqIdx !== -1) {
			const key = trimmed.slice(0, eqIdx).trim();
			let rawValue = trimmed.slice(eqIdx + 1).trim();

			// Strip inline comment (not inside strings)
			if (
				!rawValue.startsWith('"') &&
				!rawValue.startsWith("'") &&
				!rawValue.startsWith('[')
			) {
				const hashIdx = rawValue.indexOf('#');
				if (hashIdx !== -1) {
					rawValue = rawValue.slice(0, hashIdx).trim();
				}
			}

			const value = parseTomlValue(rawValue);
			const fullPath = [...currentSection, key];
			setNested(result, fullPath, value);
		}
	}

	return result;
}

const transform: Transformer = (source) => {
	const result = parseToml(source);
	return JSON.stringify(result, null, '\t');
};
export default transform;
