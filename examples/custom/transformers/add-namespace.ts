const transform = (source: string): string => {
	return `export namespace Vendor {\n${source
		.split('\n')
		.map((line) => (line ? `\t${line}` : line))
		.join('\n')}\n}\n`;
};
export default transform;
