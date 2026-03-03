import type { Transformer } from '../types/Transformer/index.js';

type SecretMatch = {
	pattern: string;
	line: number;
	snippet: string;
};

const PATTERNS: { name: string; regex: RegExp }[] = [
	{ name: 'AWS Access Key', regex: /AKIA[A-Z0-9]{16}/ },
	{ name: 'Private Key', regex: /-----BEGIN[A-Z\s]*PRIVATE KEY-----/ },
	{ name: 'Bearer Token', regex: /Bearer\s+[A-Za-z0-9._-]{20,}/ },
	{ name: 'password assignment', regex: /(?:password|passwd)\s*[=:]\s*\S+/i },
	{
		name: 'token assignment',
		regex: /(?:token|auth_token|access_token)\s*[=:]\s*\S+/i,
	},
	{
		name: 'secret assignment',
		regex: /(?:secret|client_secret)\s*[=:]\s*\S+/i,
	},
	{
		name: 'api_key assignment',
		regex: /(?:api_key|apikey|api-key)\s*[=:]\s*\S+/i,
	},
];

const transform: Transformer = (source) => {
	const lines = source.split('\n');
	const findings: SecretMatch[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		for (const { name, regex } of PATTERNS) {
			if (regex.test(line)) {
				findings.push({
					pattern: name,
					line: i + 1,
					snippet: line.trim().substring(0, 80),
				});
			}
		}
	}

	if (findings.length > 0) {
		const details = findings
			.map((f) => `  - [line ${f.line}] ${f.pattern}: ${f.snippet}`)
			.join('\n');
		throw new Error(
			`Secrets detected in source (${findings.length} finding(s)):\n${details}`,
		);
	}

	return source;
};
export default transform;
