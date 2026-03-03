import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	let result = source;

	// const { a, b } = require('module') → import { a, b } from 'module';
	result = result.replace(
		/const\s+(\{[^}]+\})\s*=\s*require\(\s*(['"][^'"]+['"])\s*\)/g,
		'import $1 from $2',
	);

	// const x = require('module') → import x from 'module';
	result = result.replace(
		/const\s+(\w+)\s*=\s*require\(\s*(['"][^'"]+['"])\s*\)/g,
		'import $1 from $2',
	);

	// module.exports.foo = bar → export const foo = bar;
	result = result.replace(
		/module\.exports\.(\w+)\s*=\s*(.+)/g,
		'export const $1 = $2',
	);

	// exports.foo = bar → export const foo = bar;
	result = result.replace(/exports\.(\w+)\s*=\s*(.+)/g, 'export const $1 = $2');

	// module.exports = { a, b } → export default { a, b };
	result = result.replace(
		/module\.exports\s*=\s*(\{[^}]+\})/g,
		'export default $1',
	);

	// module.exports = x → export default x;
	result = result.replace(/module\.exports\s*=\s*(.+)/g, 'export default $1');

	return result;
};
export default transform;
