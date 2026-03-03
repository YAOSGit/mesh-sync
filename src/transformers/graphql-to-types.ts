import type { Transformer } from '../types/Transformer/index.js';

type GqlField = {
	name: string;
	type: string;
	required: boolean;
	list: boolean;
};

function mapScalar(gqlType: string): string {
	switch (gqlType) {
		case 'String':
		case 'ID':
			return 'string';
		case 'Int':
		case 'Float':
			return 'number';
		case 'Boolean':
			return 'boolean';
		default:
			return gqlType;
	}
}

function parseFieldType(raw: string): { tsType: string; required: boolean } {
	let trimmed = raw.trim();
	const required = trimmed.endsWith('!');
	if (required) trimmed = trimmed.slice(0, -1);

	const listMatch = trimmed.match(/^\[(.+)\]$/);
	if (listMatch) {
		let inner = listMatch[1];
		const innerRequired = inner.endsWith('!');
		if (innerRequired) inner = inner.slice(0, -1);
		return { tsType: `${mapScalar(inner)}[]`, required };
	}

	return { tsType: mapScalar(trimmed), required };
}

function parseFields(body: string): GqlField[] {
	const fields: GqlField[] = [];
	const lines = body.split('\n');
	for (const line of lines) {
		const cleaned = line.replace(/#.*$/, '').trim();
		if (!cleaned) continue;
		const match = cleaned.match(/^(\w+)\s*:\s*(.+)$/);
		if (match) {
			const { tsType, required } = parseFieldType(match[2]);
			fields.push({ name: match[1], type: tsType, required, list: false });
		}
	}
	return fields;
}

function generateObjectType(name: string, body: string): string {
	const fields = parseFields(body);
	const members = fields
		.map((f) => `\t${f.name}${f.required ? '' : '?'}: ${f.type};`)
		.join('\n');
	return `export type ${name} = {\n${members}\n};\n`;
}

function generateEnum(name: string, body: string): string {
	const values = body
		.split('\n')
		.map((l) => l.replace(/#.*$/, '').trim())
		.filter((l) => l.length > 0);
	const members = values.map((v) => `\t${v} = '${v}'`).join(',\n');
	return `export enum ${name} {\n${members}\n}\n`;
}

const transform: Transformer = (source) => {
	// Remove block comments (not standard GQL but handle gracefully)
	const cleaned = source.replace(/"""[\s\S]*?"""/g, '');

	const output: string[] = [];

	// Scalar declarations
	for (const scalarMatch of cleaned.matchAll(/scalar\s+(\w+)/g)) {
		output.push(`export type ${scalarMatch[1]} = string;\n`);
	}

	// Enum declarations
	for (const enumMatch of cleaned.matchAll(/enum\s+(\w+)\s*\{([^}]*)}/g)) {
		output.push(generateEnum(enumMatch[1], enumMatch[2]));
	}

	// Type / input declarations
	const typeRe =
		/(?:type|input)\s+(\w+)(?:\s+implements\s+\w+(?:\s*&\s*\w+)*)?\s*\{([^}]*)}/g;
	for (const typeMatch of cleaned.matchAll(typeRe)) {
		output.push(generateObjectType(typeMatch[1], typeMatch[2]));
	}

	if (output.length === 0) {
		return '// No types found in GraphQL schema\n';
	}

	return `// Auto-generated from GraphQL schema\n\n${output.join('\n')}`;
};
export default transform;
