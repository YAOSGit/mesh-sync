import { describe, expect, it } from 'vitest';
import {
	gitSourceToRawUrl,
	parseGitUri,
	resolveSourceType,
} from './resolver.js';

describe('resolveSourceType', () => {
	it('detects HTTPS URLs', () => {
		expect(resolveSourceType('https://api.example.com/spec.json')).toEqual({
			type: 'url',
			value: 'https://api.example.com/spec.json',
		});
	});

	it('detects HTTP URLs', () => {
		expect(resolveSourceType('http://localhost:3000/api')).toEqual({
			type: 'url',
			value: 'http://localhost:3000/api',
		});
	});

	it('detects relative paths', () => {
		const result = resolveSourceType('./src/file.ts');
		expect(result.type).toBe('local');
	});

	it('detects parent paths', () => {
		const result = resolveSourceType('../core-lib/utils.ts');
		expect(result.type).toBe('local');
	});

	it('detects absolute paths', () => {
		const result = resolveSourceType('/usr/local/share/data.json');
		expect(result.type).toBe('local');
	});

	it('detects git:// URIs', () => {
		const result = resolveSourceType(
			'git://github.com/org/repo#main:src/types.ts',
		);
		expect(result.type).toBe('git');
	});
});

describe('parseGitUri', () => {
	it('parses a GitHub git URI', () => {
		const result = parseGitUri('git://github.com/org/repo#main:src/types.ts');
		expect(result).toEqual({
			type: 'git',
			host: 'github.com',
			repo: 'org/repo',
			ref: 'main',
			path: 'src/types.ts',
		});
	});

	it('parses a GitLab git URI', () => {
		const result = parseGitUri('git://gitlab.com/org/repo#v2.0:lib/utils.ts');
		expect(result).toEqual({
			type: 'git',
			host: 'gitlab.com',
			repo: 'org/repo',
			ref: 'v2.0',
			path: 'lib/utils.ts',
		});
	});

	it('parses nested repo paths', () => {
		const result = parseGitUri(
			'git://github.com/org/sub/repo#develop:deep/path/file.json',
		);
		expect(result.repo).toBe('org/sub/repo');
		expect(result.path).toBe('deep/path/file.json');
	});

	it('throws on missing #ref:path', () => {
		expect(() => parseGitUri('git://github.com/org/repo')).toThrow(
			/missing #ref:path/i,
		);
	});

	it('throws on missing :path', () => {
		expect(() => parseGitUri('git://github.com/org/repo#main')).toThrow(
			/missing :path/i,
		);
	});

	it('throws on empty ref', () => {
		expect(() => parseGitUri('git://github.com/org/repo#:file.ts')).toThrow(
			/must not be empty/i,
		);
	});

	it('throws on empty path', () => {
		expect(() => parseGitUri('git://github.com/org/repo#main:')).toThrow(
			/must not be empty/i,
		);
	});

	it('throws on missing repo', () => {
		expect(() => parseGitUri('git://github.com#main:file.ts')).toThrow(
			/missing repo path/i,
		);
	});
});

describe('gitSourceToRawUrl', () => {
	it('constructs GitHub raw URL', () => {
		const url = gitSourceToRawUrl({
			type: 'git',
			host: 'github.com',
			repo: 'org/repo',
			ref: 'main',
			path: 'src/types.ts',
		});
		expect(url).toBe(
			'https://raw.githubusercontent.com/org/repo/main/src/types.ts',
		);
	});

	it('constructs GitLab raw URL', () => {
		const url = gitSourceToRawUrl({
			type: 'git',
			host: 'gitlab.com',
			repo: 'org/repo',
			ref: 'v2.0',
			path: 'lib/utils.ts',
		});
		expect(url).toBe('https://gitlab.com/org/repo/-/raw/v2.0/lib/utils.ts');
	});

	it('constructs Bitbucket raw URL', () => {
		const url = gitSourceToRawUrl({
			type: 'git',
			host: 'bitbucket.org',
			repo: 'org/repo',
			ref: 'develop',
			path: 'config.json',
		});
		expect(url).toBe('https://bitbucket.org/org/repo/raw/develop/config.json');
	});

	it('throws on unsupported host', () => {
		expect(() =>
			gitSourceToRawUrl({
				type: 'git',
				host: 'gitea.example.com',
				repo: 'org/repo',
				ref: 'main',
				path: 'file.ts',
			}),
		).toThrow(/unsupported git host/i);
	});
});
