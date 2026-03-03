import type { Transformer } from '../types/Transformer/index.js';

function mapProtoType(protoType: string): string {
	switch (protoType) {
		case 'string':
			return 'string';
		case 'int32':
		case 'int64':
		case 'uint32':
		case 'uint64':
		case 'sint32':
		case 'sint64':
		case 'fixed32':
		case 'fixed64':
		case 'sfixed32':
		case 'sfixed64':
		case 'float':
		case 'double':
			return 'number';
		case 'bool':
			return 'boolean';
		case 'bytes':
			return 'Uint8Array';
		default:
			return protoType;
	}
}

function stripComments(source: string): string {
	// Remove single-line comments
	let result = source.replace(/\/\/.*$/gm, '');
	// Remove block comments
	result = result.replace(/\/\*[\s\S]*?\*\//g, '');
	return result;
}

type ParsedField = {
	name: string;
	tsType: string;
	optional: boolean;
};

type ParsedEnum = {
	name: string;
	values: { name: string; number: number }[];
};

type ParsedMessage = {
	name: string;
	fields: ParsedField[];
	oneofs: { name: string; fields: ParsedField[] }[];
	nested: ParsedMessage[];
	enums: ParsedEnum[];
};

function parseEnum(name: string, body: string): ParsedEnum {
	const values: { name: string; number: number }[] = [];
	const lines = body.split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('//')) continue;
		const match = trimmed.match(/^(\w+)\s*=\s*(\d+)\s*;/);
		if (match) {
			values.push({ name: match[1], number: parseInt(match[2], 10) });
		}
	}
	return { name, values };
}

function findMatchingBrace(text: string, start: number): number {
	let depth = 0;
	for (let i = start; i < text.length; i++) {
		if (text[i] === '{') depth++;
		else if (text[i] === '}') {
			depth--;
			if (depth === 0) return i;
		}
	}
	return -1;
}

function parseMessage(name: string, body: string): ParsedMessage {
	const fields: ParsedField[] = [];
	const oneofs: { name: string; fields: ParsedField[] }[] = [];
	const nested: ParsedMessage[] = [];
	const enums: ParsedEnum[] = [];

	// Extract nested messages first
	let remaining = body;

	// Handle nested messages
	const nestedRanges: [number, number][] = [];

	for (const msgMatch of remaining.matchAll(/\bmessage\s+(\w+)\s*\{/g)) {
		const braceStart = (msgMatch.index ?? 0) + msgMatch[0].length - 1;
		const braceEnd = findMatchingBrace(remaining, braceStart);
		if (braceEnd === -1) continue;
		const innerBody = remaining.slice(braceStart + 1, braceEnd);
		nested.push(parseMessage(msgMatch[1], innerBody));
		nestedRanges.push([msgMatch.index ?? 0, braceEnd + 1]);
	}

	// Handle nested enums
	for (const enumMatch of remaining.matchAll(/\benum\s+(\w+)\s*\{/g)) {
		const braceStart = (enumMatch.index ?? 0) + enumMatch[0].length - 1;
		const braceEnd = findMatchingBrace(remaining, braceStart);
		if (braceEnd === -1) continue;
		const innerBody = remaining.slice(braceStart + 1, braceEnd);
		enums.push(parseEnum(enumMatch[1], innerBody));
		nestedRanges.push([enumMatch.index ?? 0, braceEnd + 1]);
	}

	// Handle oneof
	for (const oneofMatch of remaining.matchAll(/\boneof\s+(\w+)\s*\{/g)) {
		const braceStart = (oneofMatch.index ?? 0) + oneofMatch[0].length - 1;
		const braceEnd = findMatchingBrace(remaining, braceStart);
		if (braceEnd === -1) continue;
		const innerBody = remaining.slice(braceStart + 1, braceEnd);
		const oneofFields: ParsedField[] = [];
		const lines = innerBody.split('\n');
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) continue;
			const fieldMatch = trimmed.match(/^(\w+)\s+(\w+)\s*=\s*\d+\s*;/);
			if (fieldMatch) {
				oneofFields.push({
					name: fieldMatch[2],
					tsType: mapProtoType(fieldMatch[1]),
					optional: false,
				});
			}
		}
		oneofs.push({ name: oneofMatch[1], fields: oneofFields });
		nestedRanges.push([oneofMatch.index ?? 0, braceEnd + 1]);
	}

	// Remove nested blocks from remaining to parse top-level fields
	// Sort ranges in reverse so indices remain valid
	nestedRanges.sort((a, b) => b[0] - a[0]);
	for (const [start, end] of nestedRanges) {
		remaining = remaining.slice(0, start) + remaining.slice(end);
	}

	// Parse top-level fields
	const lines = remaining.split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		if (
			!trimmed ||
			trimmed.startsWith('//') ||
			trimmed.startsWith('option ') ||
			trimmed.startsWith('reserved ')
		)
			continue;

		// repeated field
		const repeatedMatch = trimmed.match(
			/^repeated\s+(\w+(?:\.\w+)*)\s+(\w+)\s*=\s*\d+\s*;/,
		);
		if (repeatedMatch) {
			fields.push({
				name: repeatedMatch[2],
				tsType: `${mapProtoType(repeatedMatch[1])}[]`,
				optional: false,
			});
			continue;
		}

		// optional field
		const optionalMatch = trimmed.match(
			/^optional\s+(\w+(?:\.\w+)*)\s+(\w+)\s*=\s*\d+\s*;/,
		);
		if (optionalMatch) {
			fields.push({
				name: optionalMatch[2],
				tsType: mapProtoType(optionalMatch[1]),
				optional: true,
			});
			continue;
		}

		// map field
		const mapMatch = trimmed.match(
			/^map<(\w+),\s*(\w+)>\s+(\w+)\s*=\s*\d+\s*;/,
		);
		if (mapMatch) {
			fields.push({
				name: mapMatch[3],
				tsType: `Record<${mapProtoType(mapMatch[1])}, ${mapProtoType(mapMatch[2])}>`,
				optional: false,
			});
			continue;
		}

		// normal field
		const fieldMatch = trimmed.match(/^(\w+(?:\.\w+)*)\s+(\w+)\s*=\s*\d+\s*;/);
		if (fieldMatch) {
			fields.push({
				name: fieldMatch[2],
				tsType: mapProtoType(fieldMatch[1]),
				optional: false,
			});
		}
	}

	return { name, fields, oneofs, nested, enums };
}

function emitMessage(msg: ParsedMessage): string {
	const parts: string[] = [];

	// Emit nested enums
	for (const e of msg.enums) {
		parts.push(emitEnum(e));
	}

	// Emit nested messages
	for (const n of msg.nested) {
		parts.push(emitMessage(n));
	}

	const members: string[] = [];

	for (const f of msg.fields) {
		const opt = f.optional ? '?' : '';
		const type = f.optional ? `${f.tsType} | undefined` : f.tsType;
		members.push(`\t${f.name}${opt}: ${type};`);
	}

	for (const o of msg.oneofs) {
		const unionParts = o.fields.map((f) => `{ ${f.name}: ${f.tsType} }`);
		members.push(`\t${o.name}: ${unionParts.join(' | ')};`);
	}

	parts.push(`export type ${msg.name} = {\n${members.join('\n')}\n};\n`);
	return parts.join('\n');
}

function emitEnum(e: ParsedEnum): string {
	const members = e.values.map((v) => `\t${v.name} = ${v.number}`).join(',\n');
	return `export enum ${e.name} {\n${members}\n}\n`;
}

const transform: Transformer = (source) => {
	const cleaned = stripComments(source);
	const output: string[] = [];

	// We need to only match top-level constructs, not ones inside messages.
	// Strategy: find messages first, then top-level enums outside message bodies.

	// Extract top-level messages
	const topLevelBlocks: { start: number; end: number }[] = [];

	for (const topMsgMatch of cleaned.matchAll(/\bmessage\s+(\w+)\s*\{/g)) {
		const braceStart = (topMsgMatch.index ?? 0) + topMsgMatch[0].length - 1;
		const braceEnd = findMatchingBrace(cleaned, braceStart);
		if (braceEnd === -1) continue;
		const innerBody = cleaned.slice(braceStart + 1, braceEnd);
		const msg = parseMessage(topMsgMatch[1], innerBody);
		output.push(emitMessage(msg));
		topLevelBlocks.push({
			start: topMsgMatch.index ?? 0,
			end: braceEnd + 1,
		});
	}

	// Extract top-level enums (not inside messages)
	for (const enumMatch of cleaned.matchAll(/\benum\s+(\w+)\s*\{/g)) {
		// Check if inside a message block
		const pos = enumMatch.index ?? 0;
		const insideBlock = topLevelBlocks.some(
			(b) => pos > b.start && pos < b.end,
		);
		if (insideBlock) continue;

		const braceStart = (enumMatch.index ?? 0) + enumMatch[0].length - 1;
		const braceEnd = findMatchingBrace(cleaned, braceStart);
		if (braceEnd === -1) continue;
		const innerBody = cleaned.slice(braceStart + 1, braceEnd);
		const e = parseEnum(enumMatch[1], innerBody);
		output.push(emitEnum(e));
	}

	if (output.length === 0) {
		return '// No types found in protobuf\n';
	}

	return `// Auto-generated from protobuf\n\n${output.join('\n')}`;
};
export default transform;
