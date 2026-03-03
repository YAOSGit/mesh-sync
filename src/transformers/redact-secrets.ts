import type { Transformer } from '../types/Transformer/index.js';

const transform: Transformer = (source) => {
	let result = source;

	// Replace private key blocks
	result = result.replace(
		/-----BEGIN[A-Z\s]*PRIVATE KEY-----[\s\S]*?-----END[A-Z\s]*PRIVATE KEY-----/g,
		'[REDACTED PRIVATE KEY]',
	);

	// Replace Bearer tokens
	result = result.replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]');

	// Replace AWS access key IDs
	result = result.replace(/AKIA[A-Z0-9]{16}/g, '[REDACTED]');

	// Replace .env format: SECRET_KEY=value
	result = result.replace(
		/^((?:PASSWORD|SECRET|TOKEN|API_KEY|APIKEY|API[-_]KEY|AUTH|AUTHORIZATION|ACCESS_KEY|PRIVATE_KEY|CLIENT_SECRET)[A-Z_]*)=(.+)$/gim,
		'$1=[REDACTED]',
	);

	// Replace JSON format: "secret": "value"
	result = result.replace(
		/("(?:password|secret|token|api_key|apikey|api-key|authorization|auth|access_key|private_key|client_secret)")\s*:\s*"[^"]*"/gi,
		'$1: "[REDACTED]"',
	);

	// Replace YAML format: secret: value (not already redacted, not a nested key)
	result = result.replace(
		/^(\s*(?:password|secret|token|api_key|apikey|api-key|authorization|auth|access_key|private_key|client_secret))\s*:\s*(.+)$/gim,
		(_match, key: string, value: string) => {
			if (value.includes('[REDACTED]') || value.trim() === '') return _match;
			return `${key}: [REDACTED]`;
		},
	);

	return result;
};
export default transform;
