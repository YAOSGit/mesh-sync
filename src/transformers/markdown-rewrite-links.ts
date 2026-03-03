import type { Transformer } from '../types/Transformer/index.js';

const isRelative = (url: string): boolean => {
	if (url.startsWith('http://') || url.startsWith('https://')) return false;
	if (url.startsWith('#')) return false;
	if (url.startsWith('mailto:')) return false;
	return true;
};

const joinUrl = (base: string, path: string): string => {
	const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
	const cleanPath = path.startsWith('./') ? path.slice(2) : path;
	return `${cleanBase}/${cleanPath}`;
};

const transform: Transformer = (source) => {
	const baseUrl = process.env.MESH_SYNC_BASE_URL;
	if (!baseUrl) {
		return source;
	}

	let result = source;

	// Rewrite image sources: ![alt](relative) → ![alt](absolute)
	result = result.replace(
		/!\[([^\]]*)\]\(([^)]+)\)/g,
		(match, alt: string, url: string) => {
			if (isRelative(url)) {
				return `![${alt}](${joinUrl(baseUrl, url)})`;
			}
			return match;
		},
	);

	// Rewrite links: [text](relative) → [text](absolute)
	result = result.replace(
		/\[([^\]]*)\]\(([^)]+)\)/g,
		(match, text: string, url: string) => {
			if (isRelative(url)) {
				return `[${text}](${joinUrl(baseUrl, url)})`;
			}
			return match;
		},
	);

	return result;
};
export default transform;
