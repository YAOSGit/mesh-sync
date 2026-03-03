import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	return source.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, rawKey: string) => {
		const key = rawKey.trim();
		const value = process.env[key];
		return value !== undefined ? value : `{{${rawKey}}}`;
	});
};
export default transform;
