import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source, context) => {
	const banner = [
		'// =============================================================================',
		'// AUTO-GENERATED — DO NOT EDIT',
		`// Source: ${context.sourcePath}`,
		`// Generator: mesh-sync (${context.sourceId})`,
		'// =============================================================================',
	].join('\n');

	return `${banner}\n\n${source}`;
};
export default transform;
