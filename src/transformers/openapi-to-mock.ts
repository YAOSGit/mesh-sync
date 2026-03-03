import type { Transformer } from '../types/Transformer/index.js';

type SchemaObject = {
	type?: string;
	properties?: Record<string, SchemaObject>;
	required?: string[];
	items?: SchemaObject;
	$ref?: string;
	enum?: (string | number | boolean)[];
	example?: unknown;
	format?: string;
	allOf?: SchemaObject[];
	oneOf?: SchemaObject[];
	anyOf?: SchemaObject[];
	additionalProperties?: boolean | SchemaObject;
	default?: unknown;
};

function resolveRef(
	ref: string,
	schemas: Record<string, SchemaObject>,
): SchemaObject | undefined {
	const name = ref.split('/').pop();
	if (!name) return undefined;
	return schemas[name];
}

function generateMock(
	schema: SchemaObject,
	fieldName: string,
	schemas: Record<string, SchemaObject>,
	visited: Set<string>,
): unknown {
	if (schema.$ref) {
		const refName = schema.$ref.split('/').pop() ?? '';
		if (visited.has(refName)) return {};
		const resolved = resolveRef(schema.$ref, schemas);
		if (!resolved) return {};
		visited.add(refName);
		const result = generateMock(resolved, refName, schemas, visited);
		visited.delete(refName);
		return result;
	}

	if (schema.example !== undefined) {
		return schema.example;
	}

	if (schema.default !== undefined) {
		return schema.default;
	}

	if (schema.enum && schema.enum.length > 0) {
		return schema.enum[0];
	}

	if (schema.allOf) {
		const merged: Record<string, unknown> = {};
		for (const sub of schema.allOf) {
			const result = generateMock(sub, fieldName, schemas, visited);
			if (
				typeof result === 'object' &&
				result !== null &&
				!Array.isArray(result)
			) {
				Object.assign(merged, result);
			}
		}
		return merged;
	}

	if (schema.oneOf && schema.oneOf.length > 0) {
		return generateMock(schema.oneOf[0], fieldName, schemas, visited);
	}

	if (schema.anyOf && schema.anyOf.length > 0) {
		return generateMock(schema.anyOf[0], fieldName, schemas, visited);
	}

	switch (schema.type) {
		case 'string': {
			if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
			if (schema.format === 'date') return '2024-01-01';
			if (schema.format === 'email') return `${fieldName}@example.com`;
			if (schema.format === 'uri' || schema.format === 'url')
				return `https://example.com/${fieldName}`;
			if (schema.format === 'uuid')
				return '00000000-0000-0000-0000-000000000000';
			return `string-${fieldName}`;
		}
		case 'number':
		case 'integer':
			return 0;
		case 'boolean':
			return false;
		case 'array': {
			if (schema.items) {
				const item = generateMock(schema.items, fieldName, schemas, visited);
				return [item];
			}
			return [];
		}
		case 'object': {
			if (schema.properties) {
				const obj: Record<string, unknown> = {};
				for (const [key, prop] of Object.entries(schema.properties)) {
					obj[key] = generateMock(prop, key, schemas, visited);
				}
				return obj;
			}
			return {};
		}
		default:
			return {};
	}
}

const transform: Transformer = (source) => {
	const spec = JSON.parse(source);
	const schemas: Record<string, SchemaObject> = spec.components?.schemas ?? {};

	if (Object.keys(schemas).length === 0) {
		return '// No schemas found in OpenAPI spec\n';
	}

	const mocks: Record<string, unknown> = {};
	for (const [name, schema] of Object.entries(schemas)) {
		mocks[name] = generateMock(schema, name, schemas, new Set());
	}

	const formatted = JSON.stringify(mocks, null, '\t');
	return `// Auto-generated mock data from OpenAPI spec\n\nexport const mocks = ${formatted} as const;\n`;
};
export default transform;
