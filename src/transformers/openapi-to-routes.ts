import type { ParameterObject } from '../types/openapi.js';
import type { Transformer } from '../types/Transformer/index.js';

type OperationObject = {
	operationId?: string;
	parameters?: ParameterObject[];
	responses?: Record<
		string,
		{ content?: Record<string, { schema?: { $ref?: string; type?: string } }> }
	>;
};

type PathItemObject = Record<
	string,
	OperationObject | ParameterObject[] | undefined
>;

function mapParamType(schema?: { type?: string }): string {
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

function extractPathParams(path: string): string[] {
	const matches = path.match(/\{(\w+)}/g);
	if (!matches) return [];
	return matches.map((m) => m.slice(1, -1));
}

function buildOperationId(method: string, path: string): string {
	const segments = path
		.replace(/\{(\w+)}/g, 'By$1')
		.split('/')
		.filter(Boolean)
		.map((s, i) => {
			const cleaned = s.replace(/[^a-zA-Z0-9]/g, '');
			if (i === 0) return cleaned;
			return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
		});
	return (
		method.toLowerCase() +
		segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('')
	);
}

function extractResponseRef(operation: OperationObject): string | undefined {
	if (!operation.responses) return undefined;
	// Look at 200 or 201 response
	for (const code of ['200', '201']) {
		const resp = operation.responses[code];
		if (!resp?.content) continue;
		const jsonContent = resp.content['application/json'];
		if (jsonContent?.schema?.$ref) {
			return jsonContent.schema.$ref.split('/').pop();
		}
	}
	return undefined;
}

const HTTP_METHODS = [
	'get',
	'post',
	'put',
	'patch',
	'delete',
	'head',
	'options',
] as const;

const transform: Transformer = (source) => {
	const spec = JSON.parse(source);
	const paths: Record<string, PathItemObject> = spec.paths ?? {};

	if (Object.keys(paths).length === 0) {
		return '// No paths found in OpenAPI spec\n';
	}

	const routes: string[] = [];

	for (const [path, pathItem] of Object.entries(paths)) {
		// Path-level parameters
		const pathLevelParams: ParameterObject[] = Array.isArray(
			pathItem.parameters,
		)
			? (pathItem.parameters as ParameterObject[])
			: [];

		for (const method of HTTP_METHODS) {
			const operation = pathItem[method] as OperationObject | undefined;
			if (!operation) continue;

			const allParams = [...pathLevelParams, ...(operation.parameters ?? [])];
			const pathParams = extractPathParams(path);
			const queryParams = allParams.filter((p) => p.in === 'query');

			const operationId =
				operation.operationId ?? buildOperationId(method, path);
			const methodUpper = method.toUpperCase();

			const paramEntries = pathParams.map((name) => {
				const paramDef = allParams.find(
					(p) => p.name === name && p.in === 'path',
				);
				const type = paramDef ? mapParamType(paramDef.schema) : 'string';
				return `${name}: '${type}'`;
			});
			const paramObj =
				paramEntries.length > 0 ? `{ ${paramEntries.join(', ')} }` : '{}';

			const queryEntries = queryParams.map((p) => {
				const type = mapParamType(p.schema);
				const opt = p.required ? '' : '?';
				return `${p.name}${opt}: '${type}'`;
			});
			const queryObj =
				queryEntries.length > 0 ? `{ ${queryEntries.join(', ')} }` : '{}';

			const responseRef = extractResponseRef(operation);
			const responsePart = responseRef ? `, response: '${responseRef}'` : '';

			routes.push(
				`\t"${methodUpper} ${path}": { path: "${path}", method: "${methodUpper}", operationId: "${operationId}", params: ${paramObj}, query: ${queryObj}${responsePart} }`,
			);
		}
	}

	return `// Auto-generated from OpenAPI spec\n\nexport const routes = {\n${routes.join(',\n')}\n} as const;\n`;
};
export default transform;
