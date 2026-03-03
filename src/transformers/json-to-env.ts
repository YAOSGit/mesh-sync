import type { Transformer } from '../types/Transformer/index.js';

function flatten(
	obj: unknown,
	prefix: string = '',
): Array<{ key: string; value: string }> {
	const entries: Array<{ key: string; value: string }> = [];

	if (obj === null || obj === undefined) {
		return entries;
	}

	if (typeof obj !== 'object') {
		return entries;
	}

	for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
		const fullKey = prefix ? `${prefix}_${key}` : key;

		if (val === null || val === undefined) {
			// Skip null/undefined
			continue;
		}

		if (Array.isArray(val)) {
			entries.push({ key: fullKey, value: val.join(',') });
		} else if (typeof val === 'object') {
			entries.push(...flatten(val, fullKey));
		} else {
			entries.push({ key: fullKey, value: String(val) });
		}
	}

	return entries;
}

function formatValue(value: string): string {
	if (
		value.includes(' ') ||
		value.includes('"') ||
		value.includes("'") ||
		value.includes('#')
	) {
		return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
	}
	return value;
}

const transform: Transformer = (source) => {
	const data = JSON.parse(source);
	const entries = flatten(data);
	return entries.map((e) => `${e.key}=${formatValue(e.value)}`).join('\n');
};
export default transform;
