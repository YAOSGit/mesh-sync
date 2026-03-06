import type { Transformer } from '../types/Transformer/index.js';

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(
	base: Record<string, unknown>,
	override: Record<string, unknown>,
): Record<string, unknown> {
	const result: Record<string, unknown> = { ...base };
	for (const key of Object.keys(override)) {
		const baseVal = base[key];
		const overrideVal = override[key];
		if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
			result[key] = deepMerge(baseVal, overrideVal);
		} else if (Array.isArray(baseVal) && Array.isArray(overrideVal)) {
			result[key] = [...baseVal, ...overrideVal];
		} else {
			result[key] = overrideVal;
		}
	}
	return result;
}

const transform: Transformer = (source) => {
	const baseJson = process.env.MESH_SYNC_MERGE_BASE;
	if (!baseJson) return source;

	const base = JSON.parse(baseJson) as Record<string, unknown>;
	const src = JSON.parse(source) as Record<string, unknown>;
	const merged = deepMerge(base, src);
	return `${JSON.stringify(merged, null, '\t')}\n`;
};
export default transform;
