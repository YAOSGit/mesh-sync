import { describe, expect, it } from 'vitest';
import transform from './csv-to-json.js';

describe('csv-to-json transformer', () => {
	it('converts simple CSV to JSON array', async () => {
		const input = 'name,age,city\nAlice,30,NYC\nBob,25,LA';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed).toHaveLength(2);
		expect(parsed[0].name).toBe('Alice');
		expect(parsed[0].age).toBe('30');
		expect(parsed[1].city).toBe('LA');
	});

	it('handles quoted fields with commas', async () => {
		const input = 'name,address\nAlice,"123 Main St, Apt 4"\nBob,"456 Oak Ave"';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed[0].address).toBe('123 Main St, Apt 4');
	});

	it('handles escaped quotes', async () => {
		const input =
			'name,quote\nAlice,"She said ""hello"""\nBob,"He said ""bye"""';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed[0].quote).toBe('She said "hello"');
		expect(parsed[1].quote).toBe('He said "bye"');
	});

	it('handles empty input', async () => {
		const input = '';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([]);
	});

	it('handles single row with headers only', async () => {
		const input = 'name,age,city';
		const result = await transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		const parsed = JSON.parse(result);
		expect(parsed).toEqual([]);
	});
});
