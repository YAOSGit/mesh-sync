import { describe, expect, it } from 'vitest';
import transform from './markdown-to-plaintext.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('markdown-to-plaintext transformer', () => {
	it('removes heading markers but keeps text', () => {
		const input = `# Title\n\n## Subtitle\n\n### Deep Heading`;
		const result = transform(input, ctx);
		expect(result).toContain('Title');
		expect(result).toContain('Subtitle');
		expect(result).toContain('Deep Heading');
		expect(result).not.toMatch(/^#/m);
	});

	it('strips bold, italic, and inline code markers', () => {
		const input = `This is **bold** and *italic* and \`code\` text.`;
		const result = transform(input, ctx);
		expect(result).toBe('This is bold and italic and code text.');
	});

	it('converts links and images to plain text', () => {
		const input = `Check [this link](https://example.com) and see ![logo](./logo.png).`;
		const result = transform(input, ctx);
		expect(result).toBe('Check this link and see logo.');
	});

	it('removes list markers and blockquotes', () => {
		const input = `> A quote\n\n- Item 1\n- Item 2\n\n1. First\n2. Second`;
		const result = transform(input, ctx);
		expect(result).toContain('A quote');
		expect(result).toContain('Item 1');
		expect(result).toContain('First');
		expect(result).not.toMatch(/^>/m);
		expect(result).not.toMatch(/^- /m);
		expect(result).not.toMatch(/^\d+\./m);
	});

	it('removes HTML tags and horizontal rules', () => {
		const input = `Some text.\n\n---\n\n<div class="note">Important</div>\n\nEnd.`;
		const result = transform(input, ctx);
		expect(result).toContain('Some text.');
		expect(result).toContain('Important');
		expect(result).toContain('End.');
		expect(result).not.toContain('---');
		expect(result).not.toContain('<div');
	});
});
