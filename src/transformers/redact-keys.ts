import type { Transformer } from '../types/Transformer/index.js';

const DEFAULT_KEYS = [
	'password',
	'secret',
	'token',
	'apikey',
	'api_key',
	'authorization',
];

function getRedactKeys(): string[] {
	const envVal = process.env.MESH_SYNC_REDACT_KEYS;
	if (envVal) {
		return envVal.split(',').map((k) => k.trim().toLowerCase());
	}
	return DEFAULT_KEYS;
}

function redactObject(obj: unknown, keys: string[]): unknown {
	if (Array.isArray(obj)) {
		return obj.map((item) => redactObject(item, keys));
	}
	if (obj !== null && typeof obj === 'object') {
		const result: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
			if (keys.includes(key.toLowerCase())) {
				result[key] = '[REDACTED]';
			} else {
				result[key] = redactObject(value, keys);
			}
		}
		return result;
	}
	return obj;
}

const transform: Transformer = (source) => {
	const keys = getRedactKeys();
	const parsed = JSON.parse(source);
	const redacted = redactObject(parsed, keys);
	return `${JSON.stringify(redacted, null, 2)}\n`;
};
export default transform;
