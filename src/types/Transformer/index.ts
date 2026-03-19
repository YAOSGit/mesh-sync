export type TransformContext = {
	sourceId: string;
	sourcePath: string;
	targetPath: string;
};

export type Transformer = (
	source: string,
	context: TransformContext,
) => string | Promise<string>;
