const transform = (
	source: string,
	context: { sourceId: string; sourcePath: string; targetPath: string },
): string => {
	const header = `// Project: integration-example\n// Source: ${context.sourcePath}\n// Synced by mesh-sync\n\n`;
	return header + source;
};
export default transform;
