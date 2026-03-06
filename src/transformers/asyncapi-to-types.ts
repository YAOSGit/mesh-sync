import type { SchemaObject } from '../types/openapi.js';
import type { Transformer } from '../types/Transformer/index.js';

type MessageObject = {
	payload?: SchemaObject;
	$ref?: string;
	name?: string;
};

type ChannelObject = {
	subscribe?: { message?: MessageObject };
	publish?: { message?: MessageObject };
};

function resolveSchemaRef(
	ref: string,
	root: Record<string, unknown>,
): SchemaObject | undefined {
	const parts = ref.replace(/^#\//, '').split('/');
	let current: unknown = root;
	for (const part of parts) {
		if (current && typeof current === 'object' && current !== null) {
			current = (current as Record<string, unknown>)[part];
		} else {
			return undefined;
		}
	}
	return current as SchemaObject | undefined;
}

function mapType(schema: SchemaObject, root: Record<string, unknown>): string {
	if (schema.$ref) {
		const resolved = resolveSchemaRef(schema.$ref, root);
		if (resolved) return mapType(resolved, root);
		// fallback: use ref name
		return schema.$ref.split('/').pop() ?? 'unknown';
	}

	if (schema.enum) {
		return schema.enum
			.map((v) => (typeof v === 'string' ? `'${v}'` : String(v)))
			.join(' | ');
	}

	if (schema.allOf) {
		return schema.allOf.map((s) => mapType(s, root)).join(' & ');
	}

	if (schema.oneOf) {
		return schema.oneOf.map((s) => mapType(s, root)).join(' | ');
	}

	if (schema.anyOf) {
		return schema.anyOf.map((s) => mapType(s, root)).join(' | ');
	}

	if (schema.type === 'object' && schema.properties) {
		return generateInlineObject(schema, root);
	}

	if (schema.type === 'object') {
		return 'Record<string, unknown>';
	}

	if (schema.type === 'array') {
		if (schema.items) {
			const inner = mapType(schema.items, root);
			return `${inner}[]`;
		}
		return 'unknown[]';
	}

	switch (schema.type) {
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

function generateInlineObject(
	schema: SchemaObject,
	root: Record<string, unknown>,
): string {
	if (!schema.properties) return 'Record<string, unknown>';
	const required = new Set(schema.required ?? []);
	const fields = Object.entries(schema.properties)
		.map(([key, prop]) => {
			const opt = required.has(key) ? '' : '?';
			return `${key}${opt}: ${mapType(prop, root)}`;
		})
		.join('; ');
	return `{ ${fields} }`;
}

function generateNamedType(
	name: string,
	schema: SchemaObject,
	root: Record<string, unknown>,
): string {
	if (schema.type === 'object' && schema.properties) {
		const required = new Set(schema.required ?? []);
		const fields = Object.entries(schema.properties)
			.map(([key, prop]) => {
				const opt = required.has(key) ? '' : '?';
				return `\t${key}${opt}: ${mapType(prop, root)};`;
			})
			.join('\n');
		return `export type ${name} = {\n${fields}\n};\n`;
	}
	return `export type ${name} = ${mapType(schema, root)};\n`;
}

function toPascalCase(input: string): string {
	return input
		.split(/[/\-_.]+/)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join('');
}

function resolveMessage(
	msg: MessageObject,
	root: Record<string, unknown>,
): SchemaObject | undefined {
	if (msg.$ref) {
		const resolved = resolveSchemaRef(msg.$ref, root);
		if (resolved && typeof resolved === 'object') {
			const asMsg = resolved as unknown as MessageObject;
			if (asMsg.payload) return resolvePayload(asMsg.payload, root);
		}
		return undefined;
	}
	if (msg.payload) return resolvePayload(msg.payload, root);
	return undefined;
}

function resolvePayload(
	payload: SchemaObject,
	root: Record<string, unknown>,
): SchemaObject {
	if (payload.$ref) {
		const resolved = resolveSchemaRef(payload.$ref, root);
		if (resolved) return resolved;
	}
	return payload;
}

const transform: Transformer = (source) => {
	const spec = JSON.parse(source);
	const root = spec as Record<string, unknown>;
	const channels: Record<string, ChannelObject> = spec.channels ?? {};
	const output: string[] = [];

	// Generate types for component schemas if present
	const componentSchemas: Record<string, SchemaObject> =
		(spec.components?.schemas as Record<string, SchemaObject>) ?? {};
	for (const [name, schema] of Object.entries(componentSchemas)) {
		output.push(generateNamedType(name, schema, root));
	}

	// Generate payload types for each channel
	const channelTypeEntries: string[] = [];

	for (const [channelName, channel] of Object.entries(channels)) {
		const typeName = `${toPascalCase(channelName)}Payload`;

		// Check subscribe first, then publish
		const message = channel.subscribe?.message ?? channel.publish?.message;
		if (!message) continue;

		const payload = resolveMessage(message, root);
		if (!payload) continue;

		output.push(generateNamedType(typeName, payload, root));
		channelTypeEntries.push(`\t'${channelName}': ${typeName};`);
	}

	if (channelTypeEntries.length > 0) {
		output.push(
			`export type Channels = {\n${channelTypeEntries.join('\n')}\n};\n`,
		);
	}

	if (output.length === 0) {
		return '// No types found in AsyncAPI spec\n';
	}

	return `// Auto-generated from AsyncAPI spec\n\n${output.join('\n')}`;
};
export default transform;
