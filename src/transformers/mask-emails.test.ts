import { describe, expect, it } from 'vitest';
import transform from './mask-emails.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('mask-emails transformer', () => {
	it('masks a simple email address', () => {
		const input = 'Contact: user@example.com';
		const result = transform(input, ctx);
		expect(result).toBe('Contact: u***@e******.com');
	});

	it('masks multiple emails in text', () => {
		const input = 'From alice@corp.org to bob@mail.net';
		const result = transform(input, ctx);
		expect(result).not.toContain('alice@corp.org');
		expect(result).not.toContain('bob@mail.net');
		expect(result).toContain('a***@c***.org');
		expect(result).toContain('b***@m***.net');
	});

	it('masks emails in JSON strings', () => {
		const input = '{"email": "admin@dashboard.io", "name": "Admin"}';
		const result = transform(input, ctx);
		expect(result).toContain('a***@d********.io');
		expect(result).not.toContain('admin@dashboard.io');
		expect(result).toContain('"name": "Admin"');
	});

	it('preserves text without emails', () => {
		const input = 'No emails here, just plain text.';
		const result = transform(input, ctx);
		expect(result).toBe('No emails here, just plain text.');
	});

	it('handles single-character local part', () => {
		const input = 'a@example.com';
		const result = transform(input, ctx);
		expect(result).toBe('a@e******.com');
	});
});
