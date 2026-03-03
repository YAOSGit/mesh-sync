import type { Transformer } from '../types/Transformer/index.js';

function parseCsvRow(line: string): string[] {
	const fields: string[] = [];
	let current = '';
	let inQuotes = false;
	let i = 0;

	while (i < line.length) {
		const ch = line[i];

		if (inQuotes) {
			if (ch === '"') {
				if (i + 1 < line.length && line[i + 1] === '"') {
					// Escaped quote
					current += '"';
					i += 2;
					continue;
				}
				// End of quoted field
				inQuotes = false;
				i++;
				continue;
			}
			current += ch;
			i++;
		} else {
			if (ch === '"') {
				inQuotes = true;
				i++;
			} else if (ch === ',') {
				fields.push(current);
				current = '';
				i++;
			} else {
				current += ch;
				i++;
			}
		}
	}

	fields.push(current);
	return fields;
}

function parseCsv(source: string): Record<string, string>[] {
	const lines = source.split('\n').filter((l) => l.trim() !== '');
	if (lines.length === 0) return [];

	const headers = parseCsvRow(lines[0]);
	const rows: Record<string, string>[] = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseCsvRow(lines[i]);
		const row: Record<string, string> = {};
		for (let j = 0; j < headers.length; j++) {
			row[headers[j]] = values[j] ?? '';
		}
		rows.push(row);
	}

	return rows;
}

const transform: Transformer = (source) => {
	const result = parseCsv(source);
	return JSON.stringify(result, null, 2);
};
export default transform;
