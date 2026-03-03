import { describe, expect, it } from 'vitest';
import transform from './markdown-strip-badges.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('markdown-strip-badges transformer', () => {
	it('removes linked badge images', () => {
		const input = `[![Build Status](https://img.shields.io/build/pass)](https://ci.example.com)\n\n# My Project\n\nContent here.`;
		const result = transform(input, ctx);
		expect(result).not.toContain('Build Status');
		expect(result).toContain('# My Project');
		expect(result).toContain('Content here.');
	});

	it('removes standalone badge images from known services', () => {
		const input = `![coverage](https://shields.io/coverage/90)\n![license](https://badgen.net/badge/license/MIT)\n\nReal content.`;
		const result = transform(input, ctx);
		expect(result).not.toContain('shields.io');
		expect(result).not.toContain('badgen.net');
		expect(result).toContain('Real content.');
	});

	it('preserves non-badge images', () => {
		const input = `![screenshot](./images/screenshot.png)\n\nSome text.`;
		const result = transform(input, ctx);
		expect(result).toContain('![screenshot](./images/screenshot.png)');
	});

	it('collapses multiple blank lines after removal', () => {
		const input = `[![badge](https://img.shields.io/v1)](https://example.com)\n\n\n\n# Title\n\nContent.`;
		const result = transform(input, ctx);
		expect(result).not.toMatch(/\n{3,}/);
		expect(result).toContain('# Title');
	});

	it('handles multiple badges on separate lines', () => {
		const input = `[![a](https://img.shields.io/a)](https://a.com)\n[![b](https://img.shields.io/b)](https://b.com)\n[![c](https://img.shields.io/c)](https://c.com)\n\n# Title`;
		const result = transform(input, ctx);
		expect(result).not.toContain('img.shields.io');
		expect(result).toContain('# Title');
	});
});
