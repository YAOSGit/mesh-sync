const transform = (source: string): string => {
	return source
		.split('\n')
		.filter((line) => !line.includes('@internal'))
		.join('\n')
		.replace(/type InternalState[^;]*;/g, '');
};
export default transform;
