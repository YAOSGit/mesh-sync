export type ParameterObject = {
	name: string;
	in: string;
	required?: boolean;
	schema?: { type?: string };
};

export type SchemaObject = {
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
