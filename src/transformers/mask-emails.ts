import type { Transformer } from '../types/Transformer/index.js';

function maskEmail(email: string): string {
	const [local, domain] = email.split('@');
	if (!local || !domain) return email;

	const lastDot = domain.lastIndexOf('.');
	if (lastDot === -1) return email;

	const domainName = domain.substring(0, lastDot);
	const tld = domain.substring(lastDot);

	const maskedLocal = local.length > 1 ? `${local[0]}***` : local;

	const maskedDomain =
		domainName.length > 1
			? domainName[0] + '*'.repeat(domainName.length - 1)
			: domainName;

	return `${maskedLocal}@${maskedDomain}${tld}`;
}

const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

const transform: Transformer = (source) => {
	return source.replace(EMAIL_REGEX, (match) => maskEmail(match));
};
export default transform;
