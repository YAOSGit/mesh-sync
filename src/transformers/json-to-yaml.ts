import type { Transformer } from '../types/Transformer/index.js';

function needsQuoting(str: string): boolean {
	if (str === '') return true;
	if (str === 'true' || str === 'false' || str === 'null') return true;
	if (/^-?\d+(\.\d+)?$/.test(str)) return true;
	if (/[:{}[\],&*?|>!%#@`"']/.test(str)) return true;
	if (str.startsWith(' ') || str.endsWith(' ')) return true;
	return false;
}

function toYaml(data: unknown, indent: number): string {
	const prefix = '  '.repeat(indent);

	if (data === null || data === undefined) {
		return 'null';
	}

	if (typeof data === 'boolean') {
		return data ? 'true' : 'false';
	}

	if (typeof data === 'number') {
		return String(data);
	}

	if (typeof data === 'string') {
		return needsQuoting(data)
			? `"${data.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
			: data;
	}

	if (Array.isArray(data)) {
		if (data.length === 0) return '[]';
		const lines: string[] = [];
		for (const item of data) {
			if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
				const entries = Object.entries(item as Record<string, unknown>);
				if (entries.length > 0) {
					const [firstKey, firstVal] = entries[0];
					lines.push(`${prefix}- ${firstKey}: ${toYaml(firstVal, indent + 2)}`);
					for (let i = 1; i < entries.length; i++) {
						const [key, val] = entries[i];
						lines.push(`${prefix}  ${key}: ${toYaml(val, indent + 2)}`);
					}
				} else {
					lines.push(`${prefix}- {}`);
				}
			} else {
				lines.push(`${prefix}- ${toYaml(item, indent + 1)}`);
			}
		}
		return `\n${lines.join('\n')}`;
	}

	if (typeof data === 'object') {
		const entries = Object.entries(data as Record<string, unknown>);
		if (entries.length === 0) return '{}';
		const lines: string[] = [];
		for (const [key, val] of entries) {
			const yamlKey = needsQuoting(key) ? `"${key}"` : key;
			if (typeof val === 'object' && val !== null) {
				const nested = toYaml(val, indent + 1);
				if (nested.startsWith('\n')) {
					lines.push(`${prefix}${yamlKey}:${nested}`);
				} else {
					lines.push(`${prefix}${yamlKey}: ${nested}`);
				}
			} else {
				lines.push(`${prefix}${yamlKey}: ${toYaml(val, indent + 1)}`);
			}
		}
		if (indent === 0) {
			return lines.join('\n');
		}
		return `\n${lines.join('\n')}`;
	}

	return String(data);
}

const transform: Transformer = (source) => {
	const data = JSON.parse(source);
	return toYaml(data, 0);
};
export default transform;
