import type { Transformer } from '../types/Transformer/index.js';

type JsonSchema = {
	title?: string;
	type?: string | string[];
	properties?: Record<string, JsonSchema>;
	required?: string[];
	items?: JsonSchema;
	$ref?: string;
	enum?: (string | number | boolean | null)[];
	allOf?: JsonSchema[];
	oneOf?: JsonSchema[];
	anyOf?: JsonSchema[];
	definitions?: Record<string, JsonSchema>;
	$defs?: Record<string, JsonSchema>;
	const?: unknown;
	additionalProperties?: boolean | JsonSchema;
	description?: string;
};

function extractRefName(ref: string): string {
	const parts = ref.split('/');
	return parts[parts.length - 1];
}

function mapType(schema: JsonSchema): string {
	if (schema.$ref) {
		return extractRefName(schema.$ref);
	}

	if (schema.enum) {
		return schema.enum
			.map((v) => {
				if (v === null) return 'null';
				if (typeof v === 'string') return `'${v}'`;
				return String(v);
			})
			.join(' | ');
	}

	if (schema.const !== undefined) {
		if (typeof schema.const === 'string') return `'${schema.const}'`;
		if (schema.const === null) return 'null';
		return String(schema.const);
	}

	if (schema.allOf) {
		return schema.allOf.map((s) => mapType(s)).join(' & ');
	}

	if (schema.oneOf) {
		return schema.oneOf.map((s) => mapType(s)).join(' | ');
	}

	if (schema.anyOf) {
		return schema.anyOf.map((s) => mapType(s)).join(' | ');
	}

	if (Array.isArray(schema.type)) {
		return schema.type.map((t) => mapPrimitive(t)).join(' | ');
	}

	if (schema.type === 'object' && schema.properties) {
		return generateInlineObject(schema);
	}

	if (schema.type === 'object') {
		if (
			schema.additionalProperties &&
			typeof schema.additionalProperties === 'object'
		) {
			return `Record<string, ${mapType(schema.additionalProperties)}>`;
		}
		return 'Record<string, unknown>';
	}

	if (schema.type === 'array') {
		if (schema.items) {
			const inner = mapType(schema.items);
			const needsParens = inner.includes('|') || inner.includes('&');
			return needsParens ? `(${inner})[]` : `${inner}[]`;
		}
		return 'unknown[]';
	}

	return mapPrimitive(schema.type);
}

function mapPrimitive(type?: string): string {
	switch (type) {
		case 'string':
			return 'string';
		case 'number':
		case 'integer':
			return 'number';
		case 'boolean':
			return 'boolean';
		case 'null':
			return 'null';
		default:
			return 'unknown';
	}
}

function generateInlineObject(schema: JsonSchema): string {
	if (!schema.properties) return 'Record<string, unknown>';
	const required = new Set(schema.required ?? []);
	const fields = Object.entries(schema.properties)
		.map(([key, prop]) => {
			const opt = required.has(key) ? '' : '?';
			return `${key}${opt}: ${mapType(prop)}`;
		})
		.join('; ');
	return `{ ${fields} }`;
}

function generateNamedType(name: string, schema: JsonSchema): string {
	if (schema.enum) {
		const values = schema.enum
			.map((v) => {
				if (v === null) return 'null';
				if (typeof v === 'string') return `'${v}'`;
				return String(v);
			})
			.join(' | ');
		return `export type ${name} = ${values};\n`;
	}

	if (schema.allOf) {
		return `export type ${name} = ${schema.allOf.map((s) => mapType(s)).join(' & ')};\n`;
	}

	if (schema.oneOf) {
		return `export type ${name} = ${schema.oneOf.map((s) => mapType(s)).join(' | ')};\n`;
	}

	if (schema.anyOf) {
		return `export type ${name} = ${schema.anyOf.map((s) => mapType(s)).join(' | ')};\n`;
	}

	if (schema.type === 'array') {
		const itemType = schema.items ? mapType(schema.items) : 'unknown';
		return `export type ${name} = ${itemType}[];\n`;
	}

	if (schema.type === 'object' || schema.properties) {
		if (!schema.properties) {
			return `export type ${name} = Record<string, unknown>;\n`;
		}
		const required = new Set(schema.required ?? []);
		const fields = Object.entries(schema.properties)
			.map(([key, prop]) => {
				const opt = required.has(key) ? '' : '?';
				return `\t${key}${opt}: ${mapType(prop)};`;
			})
			.join('\n');
		return `export type ${name} = {\n${fields}\n};\n`;
	}

	return `export type ${name} = ${mapType(schema)};\n`;
}

const transform: Transformer = (source) => {
	const schema: JsonSchema = JSON.parse(source);
	const output: string[] = [];

	// Process definitions / $defs
	const definitions = schema.definitions ?? schema.$defs ?? {};
	for (const [name, def] of Object.entries(definitions)) {
		output.push(generateNamedType(name, def));
	}

	// Process root schema
	const rootName = schema.title ?? 'Root';
	if (
		schema.type ||
		schema.properties ||
		schema.allOf ||
		schema.oneOf ||
		schema.anyOf ||
		schema.enum
	) {
		output.push(generateNamedType(rootName, schema));
	}

	if (output.length === 0) {
		return '// No types found in JSON Schema\n';
	}

	return `// Auto-generated from JSON Schema\n\n${output.join('\n')}`;
};
export default transform;
