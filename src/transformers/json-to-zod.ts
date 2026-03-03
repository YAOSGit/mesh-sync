import type { Transformer } from '../types/Transformer/index.js';

interface JsonSchema {
	type?: string;
	properties?: Record<string, JsonSchema>;
	required?: string[];
	items?: JsonSchema;
	enum?: (string | number | boolean)[];
	description?: string;
}

function schemaToZod(schema: JsonSchema, indent: number = 0): string {
	const pad = '  '.repeat(indent);

	// Enum
	if (schema.enum) {
		const values = schema.enum.map((v) =>
			typeof v === 'string' ? `"${v}"` : String(v),
		);
		return `z.enum([${values.join(', ')}])`;
	}

	if (!schema.type) {
		return 'z.unknown()';
	}

	switch (schema.type) {
		case 'string':
			return 'z.string()';
		case 'number':
		case 'integer':
			return 'z.number()';
		case 'boolean':
			return 'z.boolean()';
		case 'null':
			return 'z.null()';
		case 'array': {
			if (schema.items) {
				const itemSchema = schemaToZod(schema.items, indent);
				return `z.array(${itemSchema})`;
			}
			return 'z.array(z.unknown())';
		}
		case 'object': {
			if (!schema.properties) {
				return 'z.object({})';
			}
			const required = schema.required ?? [];
			const entries = Object.entries(schema.properties);
			const fields = entries.map(([key, propSchema]) => {
				const zodType = schemaToZod(propSchema, indent + 1);
				const isRequired = required.includes(key);
				return `${pad}  ${key}: ${zodType}${isRequired ? '' : '.optional()'}`;
			});
			return `z.object({\n${fields.join(',\n')},\n${pad}})`;
		}
		default:
			return 'z.unknown()';
	}
}

const transform: Transformer = (source) => {
	const schema = JSON.parse(source) as JsonSchema;
	const zodSchema = schemaToZod(schema);
	return `import { z } from 'zod';\n\nexport const schema = ${zodSchema};\n`;
};
export default transform;
