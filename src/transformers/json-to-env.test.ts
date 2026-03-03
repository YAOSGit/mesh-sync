import { describe, expect, it } from 'vitest';
import transform from './json-to-env.js';

describe('json-to-env transformer', () => {
	it('converts flat JSON to env format', () => {
		const input = '{"DB_HOST":"localhost","DB_PORT":"5432"}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('DB_HOST=localhost');
		expect(result).toContain('DB_PORT=5432');
	});

	it('flattens nested objects with underscore separator', () => {
		const input = '{"database":{"host":"localhost","port":5432}}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('database_host=localhost');
		expect(result).toContain('database_port=5432');
	});

	it('quotes values with spaces', () => {
		const input = '{"APP_NAME":"My Application"}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('APP_NAME="My Application"');
	});

	it('skips null values', () => {
		const input = '{"KEY":"value","EMPTY":null,"OTHER":"test"}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('KEY=value');
		expect(result).toContain('OTHER=test');
		expect(result).not.toContain('EMPTY');
	});

	it('joins arrays with commas', () => {
		const input = '{"PORTS":[80,443,8080]}';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('PORTS=80,443,8080');
	});
});
