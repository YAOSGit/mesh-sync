import { describe, expect, it } from 'vitest';
import transform from './markdown-to-html.js';

describe('markdown-to-html transformer', () => {
	it('converts headings', () => {
		const input = '# Title\n## Subtitle\n### Section';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('<h1>Title</h1>');
		expect(result).toContain('<h2>Subtitle</h2>');
		expect(result).toContain('<h3>Section</h3>');
	});

	it('converts inline formatting', () => {
		const input = 'This is **bold** and *italic* and `code`.';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('<strong>bold</strong>');
		expect(result).toContain('<em>italic</em>');
		expect(result).toContain('<code>code</code>');
	});

	it('converts links and images', () => {
		const input = '[Click here](https://example.com)\n\n![Logo](logo.png)';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('<a href="https://example.com">Click here</a>');
		expect(result).toContain('<img src="logo.png" alt="Logo" />');
	});

	it('converts lists', () => {
		const input = '- Apple\n- Banana\n\n1. First\n2. Second';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('<ul><li>Apple</li><li>Banana</li></ul>');
		expect(result).toContain('<ol><li>First</li><li>Second</li></ol>');
	});

	it('converts code blocks and horizontal rules', () => {
		const input = '```\nconst x = 1;\n```\n\n---';
		const result = transform(input, {
			sourceId: 'test',
			sourcePath: '',
			targetPath: '',
		});
		expect(result).toContain('<pre><code>const x = 1;</code></pre>');
		expect(result).toContain('<hr />');
	});
});
