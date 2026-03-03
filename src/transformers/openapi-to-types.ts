import type { Transformer } from '../types/Transformer/index.js';

type SchemaProperty = {
	type?: string;
	items?: SchemaProperty;
	$ref?: string;
	enum?: (string | number | boolean)[];
	allOf?: SchemaProperty[];
	oneOf?: SchemaProperty[];
	anyOf?: SchemaProperty[];
	properties?: Record<string, SchemaProperty>;
	required?: string[];
	nullable?: boolean;
};

type Schema = {
	type?: string;
	properties?: Record<string, SchemaProperty>;
	required?: string[];
	enum?: (string | number | boolean)[];
	allOf?: SchemaProperty[];
	oneOf?: SchemaProperty[];
	anyOf?: SchemaProperty[];
	nullable?: boolean;
};

function mapType(prop: SchemaProperty): string {
	let base: string;

	if (prop.$ref) {
		const name = prop.$ref.split('/').pop() ?? 'unknown';
		base = name;
	} else if (prop.enum) {
		base = prop.enum
			.map((v) => (typeof v === 'string' ? `'${v}'` : String(v)))
			.join(' | ');
	} else if (prop.allOf) {
		base = prop.allOf.map((s) => mapType(s)).join(' & ');
	} else if (prop.oneOf) {
		base = prop.oneOf.map((s) => mapType(s)).join(' | ');
	} else if (prop.anyOf) {
		base = prop.anyOf.map((s) => mapType(s)).join(' | ');
	} else if (prop.type === 'object' && prop.properties) {
		base = generateInlineType(prop);
	} else {
		switch (prop.type) {
			case 'string':
				base = 'string';
				break;
			case 'integer':
			case 'number':
				base = 'number';
				break;
			case 'boolean':
				base = 'boolean';
				break;
			case 'array':
				base = prop.items ? `${mapType(prop.items)}[]` : 'unknown[]';
				break;
			case 'object':
				base = 'Record<string, unknown>';
				break;
			default:
				base = 'unknown';
				break;
		}
	}

	if (prop.nullable) {
		base = `${base} | null`;
	}

	return base;
}

function generateInlineType(schema: SchemaProperty): string {
	if (!schema.properties) return 'Record<string, unknown>';

	const required = new Set(schema.required ?? []);
	const fields = Object.entries(schema.properties)
		.map(([key, prop]) => {
			const optional = required.has(key) ? '' : '?';
			return `${key}${optional}: ${mapType(prop)}`;
		})
		.join('; ');

	return `{ ${fields} }`;
}

function generateType(name: string, schema: Schema): string {
	if (schema.enum) {
		const values = schema.enum
			.map((v) => (typeof v === 'string' ? `'${v}'` : String(v)))
			.join(' | ');
		return `export type ${name} = ${values};\n`;
	}

	if (schema.allOf) {
		const types = schema.allOf.map((s) => mapType(s)).join(' & ');
		return `export type ${name} = ${types};\n`;
	}

	if (schema.oneOf) {
		const types = schema.oneOf.map((s) => mapType(s)).join(' | ');
		return `export type ${name} = ${types};\n`;
	}

	if (schema.anyOf) {
		const types = schema.anyOf.map((s) => mapType(s)).join(' | ');
		return `export type ${name} = ${types};\n`;
	}

	if (!schema.properties)
		return `export type ${name} = Record<string, unknown>;\n`;

	const required = new Set(schema.required ?? []);
	const fields = Object.entries(schema.properties)
		.map(([key, prop]) => {
			const optional = required.has(key) ? '' : '?';
			return `\t${key}${optional}: ${mapType(prop)};`;
		})
		.join('\n');

	let typeDef = `export type ${name} = {\n${fields}\n};\n`;

	if (schema.nullable) {
		typeDef = `export type ${name} = {\n${fields}\n} | null;\n`;
	}

	return typeDef;
}

const transform: Transformer = (source) => {
	const spec = JSON.parse(source);
	const schemas: Record<string, Schema> = spec.components?.schemas ?? {};

	if (Object.keys(schemas).length === 0) {
		return '// No schemas found in OpenAPI spec\n';
	}

	const types = Object.entries(schemas)
		.map(([name, schema]) => generateType(name, schema))
		.join('\n');

	return `// Auto-generated from OpenAPI spec\n\n${types}`;
};
export default transform;
