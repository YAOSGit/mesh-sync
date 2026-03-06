import type { ParameterObject } from '../types/openapi.js';
import type { Transformer } from '../types/Transformer/index.js';

type RequestBodyObject = {
	content?: Record<string, { schema?: { $ref?: string; type?: string } }>;
	required?: boolean;
};

type OperationObject = {
	operationId?: string;
	parameters?: ParameterObject[];
	requestBody?: RequestBodyObject;
};

type PathItemObject = Record<
	string,
	OperationObject | ParameterObject[] | undefined
>;

const HTTP_METHODS = [
	'get',
	'post',
	'put',
	'patch',
	'delete',
	'head',
	'options',
] as const;

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildFunctionName(method: string, path: string): string {
	const segments = path
		.replace(/\{(\w+)}/g, 'By$1')
		.split('/')
		.filter(Boolean)
		.map((s) => s.replace(/[^a-zA-Z0-9]/g, ''));
	return method.toLowerCase() + segments.map((s) => capitalize(s)).join('');
}

function mapTsType(schema?: { type?: string }): string {
	if (!schema?.type) return 'string';
	switch (schema.type) {
		case 'integer':
		case 'number':
			return 'number';
		case 'boolean':
			return 'boolean';
		default:
			return 'string';
	}
}

function generateFunction(
	method: string,
	path: string,
	operation: OperationObject,
	pathLevelParams: ParameterObject[],
): string {
	const funcName = operation.operationId ?? buildFunctionName(method, path);
	const allParams = [...pathLevelParams, ...(operation.parameters ?? [])];

	const pathParams = allParams.filter((p) => p.in === 'path');
	const queryParams = allParams.filter((p) => p.in === 'query');
	const headerParams = allParams.filter((p) => p.in === 'header');
	const hasBody = !!operation.requestBody;

	// Build params type
	const paramParts: string[] = [];

	if (pathParams.length > 0) {
		const fields = pathParams
			.map((p) => `${p.name}: ${mapTsType(p.schema)}`)
			.join('; ');
		paramParts.push(`path: { ${fields} }`);
	}

	if (queryParams.length > 0) {
		const fields = queryParams
			.map((p) => {
				const opt = p.required ? '' : '?';
				return `${p.name}${opt}: ${mapTsType(p.schema)}`;
			})
			.join('; ');
		paramParts.push(`query?: { ${fields} }`);
	}

	if (headerParams.length > 0) {
		const fields = headerParams
			.map((p) => {
				const opt = p.required ? '' : '?';
				return `${p.name}${opt}: string`;
			})
			.join('; ');
		paramParts.push(`headers?: { ${fields} }`);
	}

	if (hasBody) {
		paramParts.push('body?: unknown');
	}

	const hasRequired = pathParams.length > 0 || hasBody;
	const paramTypeInner = paramParts.join('; ');
	const paramsArg =
		paramParts.length > 0
			? `params${hasRequired ? '' : '?'}: { ${paramTypeInner} }`
			: '';

	const lines: string[] = [];
	lines.push(
		`export async function ${funcName}(${paramsArg}): Promise<Response> {`,
	);

	// Build URL with path params
	if (pathParams.length > 0) {
		let urlTemplate = path;
		for (const p of pathParams) {
			urlTemplate = urlTemplate.replace(
				`{${p.name}}`,
				`\${params.path.${p.name}}`,
			);
		}
		lines.push(`\tconst url = new URL(\`${urlTemplate}\`, BASE_URL);`);
	} else {
		lines.push(`\tconst url = new URL('${path}', BASE_URL);`);
	}

	// Query params
	if (queryParams.length > 0) {
		lines.push(`\tif (params?.query) {`);
		lines.push(`\t\tObject.entries(params.query).forEach(([k, v]) => {`);
		lines.push(
			`\t\t\tif (v !== undefined) url.searchParams.set(k, String(v));`,
		);
		lines.push(`\t\t});`);
		lines.push(`\t}`);
	}

	// Build fetch options
	const methodUpper = method.toUpperCase();
	const fetchOpts: string[] = [`method: '${methodUpper}'`];

	if (headerParams.length > 0) {
		fetchOpts.push(`headers: params?.headers as Record<string, string>`);
	}

	if (hasBody) {
		fetchOpts.push(`headers: { 'Content-Type': 'application/json' }`);
		fetchOpts.push(`body: JSON.stringify(params?.body)`);
	}

	lines.push(`\treturn fetch(url.toString(), { ${fetchOpts.join(', ')} });`);
	lines.push(`}`);

	return lines.join('\n');
}

const transform: Transformer = (source) => {
	const spec = JSON.parse(source);
	const paths: Record<string, PathItemObject> = spec.paths ?? {};

	if (Object.keys(paths).length === 0) {
		return '// No paths found in OpenAPI spec\n';
	}

	const functions: string[] = [];
	functions.push(`const BASE_URL = process.env.MESH_SYNC_BASE_URL ?? '';\n`);

	for (const [path, pathItem] of Object.entries(paths)) {
		const pathLevelParams: ParameterObject[] = Array.isArray(
			pathItem.parameters,
		)
			? (pathItem.parameters as ParameterObject[])
			: [];

		for (const method of HTTP_METHODS) {
			const operation = pathItem[method] as OperationObject | undefined;
			if (!operation) continue;

			functions.push(
				generateFunction(method, path, operation, pathLevelParams),
			);
		}
	}

	return `// Auto-generated fetch wrappers from OpenAPI spec\n\n${functions.join('\n\n')}\n`;
};
export default transform;
