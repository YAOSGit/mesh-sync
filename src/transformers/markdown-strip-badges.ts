import type { Transformer } from '../types/Transformer/index.js';

const BADGE_SERVICES =
	/shields\.io|badgen\.net|img\.shields\.io|badge|travis-ci|codecov|coveralls|david-dm/i;

const transform: Transformer = (source) => {
	let result = source;

	// Remove linked badge images: [![alt](badge-url)](link-url)
	result = result.replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, '');

	// Remove standalone badge images where URL matches badge services
	result = result.replace(/!\[[^\]]*\]\(([^)]*)\)/g, (match, url: string) => {
		if (BADGE_SERVICES.test(url)) {
			return '';
		}
		return match;
	});

	// Collapse multiple blank lines into at most two newlines
	result = result.replace(/\n{3,}/g, '\n\n');

	// Trim leading blank lines
	result = result.replace(/^\n+/, '');

	return result;
};
export default transform;
