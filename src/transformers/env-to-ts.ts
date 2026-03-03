import type { Transformer } from '../types/Transformer/index.js';

function parseEnv(source: string): Array<{ key: string; value: string }> {
	const entries: Array<{ key: string; value: string }> = [];
	const lines = source.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();

		// Skip empty lines and comments
		if (trimmed === '' || trimmed.startsWith('#')) continue;

		const eqIdx = trimmed.indexOf('=');
		if (eqIdx === -1) continue;

		const key = trimmed.slice(0, eqIdx).trim();
		let value = trimmed.slice(eqIdx + 1).trim();

		// Strip quotes
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		entries.push({ key, value });
	}

	return entries;
}

const transform: Transformer = (source) => {
	const entries = parseEnv(source);

	if (entries.length === 0) {
		return 'export type Env = {};\n\nexport const env: Env = {} as const;\n';
	}

	const typeFields = entries.map((e) => `  ${e.key}: string;`).join('\n');
	const valueFields = entries
		.map(
			(e) =>
				`  ${e.key}: "${e.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",`,
		)
		.join('\n');

	return `export type Env = {\n${typeFields}\n};\n\nexport const env: Env = {\n${valueFields}\n} as const;\n`;
};
export default transform;
