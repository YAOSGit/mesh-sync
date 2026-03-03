import { createHash } from 'node:crypto';
import type { Transformer } from '../types/Transformer/index.js';

function hashString(value: string): string {
	return createHash('sha256').update(value).digest('hex').substring(0, 16);
}

function hashValues(obj: unknown): unknown {
	if (Array.isArray(obj)) {
		return obj.map((item) => hashValues(item));
	}
	if (obj !== null && typeof obj === 'object') {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
			result[key] = hashValues(value);
		}
		return result;
	}
	if (typeof obj === 'string') {
		return hashString(obj);
	}
	return obj;
}

const transform: Transformer = (source) => {
	const parsed = JSON.parse(source);
	const hashed = hashValues(parsed);
	return `${JSON.stringify(hashed, null, 2)}\n`;
};
export default transform;
