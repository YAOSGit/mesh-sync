import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	const envMap = process.env.MESH_SYNC_RENAME_MAP;
	if (!envMap) return source;

	let renameMap: Record<string, string>;
	try {
		renameMap = JSON.parse(envMap);
	} catch {
		return source;
	}

	let result = source;

	for (const [oldName, newName] of Object.entries(renameMap)) {
		const exportKeywords = [
			'function',
			'const',
			'type',
			'interface',
			'class',
			'enum',
		];
		for (const keyword of exportKeywords) {
			const pattern = new RegExp(
				`(export\\s+${keyword}\\s+)${escapeRegex(oldName)}\\b`,
				'g',
			);
			result = result.replace(pattern, `$1${newName}`);
		}

		// Replace in `export { oldName }` and `export { oldName as ... }`
		result = result.replace(
			new RegExp(`(export\\s*\\{[^}]*?)\\b${escapeRegex(oldName)}\\b`, 'g'),
			`$1${newName}`,
		);
	}

	return result;
};

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default transform;
