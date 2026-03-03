export type ResolvedSource =
	| { type: 'url'; value: string }
	| { type: 'local'; value: string }
	| { type: 'git'; host: string; repo: string; ref: string; path: string };

const RAW_URL_BUILDERS: Record<
	string,
	(repo: string, ref: string, path: string) => string
> = {
	'github.com': (repo, ref, path) =>
		`https://raw.githubusercontent.com/${repo}/${ref}/${path}`,
	'gitlab.com': (repo, ref, path) =>
		`https://gitlab.com/${repo}/-/raw/${ref}/${path}`,
	'bitbucket.org': (repo, ref, path) =>
		`https://bitbucket.org/${repo}/raw/${ref}/${path}`,
};

export function parseGitUri(source: string): ResolvedSource & { type: 'git' } {
	// Format: git://host/org/repo#ref:path/to/file
	const withoutScheme = source.slice('git://'.length);
	const hashIndex = withoutScheme.indexOf('#');

	if (hashIndex === -1) {
		throw new Error(`Invalid git source "${source}": missing #ref:path`);
	}

	const hostAndRepo = withoutScheme.slice(0, hashIndex);
	const refAndPath = withoutScheme.slice(hashIndex + 1);
	const colonIndex = refAndPath.indexOf(':');

	if (colonIndex === -1) {
		throw new Error(`Invalid git source "${source}": missing :path after ref`);
	}

	const ref = refAndPath.slice(0, colonIndex);
	const filePath = refAndPath.slice(colonIndex + 1);

	if (!ref || !filePath) {
		throw new Error(
			`Invalid git source "${source}": ref and path must not be empty`,
		);
	}

	const firstSlash = hostAndRepo.indexOf('/');
	if (firstSlash === -1) {
		throw new Error(
			`Invalid git source "${source}": missing repo path after host`,
		);
	}

	const host = hostAndRepo.slice(0, firstSlash);
	const repo = hostAndRepo.slice(firstSlash + 1);

	return { type: 'git', host, repo, ref, path: filePath };
}

export function gitSourceToRawUrl(
	source: ResolvedSource & { type: 'git' },
): string {
	const builder = RAW_URL_BUILDERS[source.host];
	if (!builder) {
		throw new Error(
			`Unsupported git host "${source.host}". Supported: ${Object.keys(RAW_URL_BUILDERS).join(', ')}`,
		);
	}
	return builder(source.repo, source.ref, source.path);
}

export function resolveSourceType(source: string): ResolvedSource {
	if (source.startsWith('git://')) {
		return parseGitUri(source);
	}
	if (source.startsWith('http://') || source.startsWith('https://')) {
		return { type: 'url', value: source };
	}
	return { type: 'local', value: source };
}
