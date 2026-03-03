import { describe, expect, it } from 'vitest';
import transform from './markdown-toc.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('markdown-toc transformer', () => {
	it('generates TOC from headings and prepends it', async () => {
		const input = `# Introduction\n\n## Getting Started\n\nSome text.\n\n## API Reference\n\nMore text.`;
		const result = await transform(input, ctx);
		expect(result).toContain('## Table of Contents');
		expect(result).toContain('- [Introduction](#introduction)');
		expect(result).toContain('  - [Getting Started](#getting-started)');
		expect(result).toContain('  - [API Reference](#api-reference)');
	});

	it('handles nested headings with proper indentation', async () => {
		const input = `# Top\n\n## Middle\n\n### Deep\n\n#### Deeper`;
		const result = await transform(input, ctx);
		expect(result).toContain('- [Top](#top)');
		expect(result).toContain('  - [Middle](#middle)');
		expect(result).toContain('    - [Deep](#deep)');
		expect(result).toContain('      - [Deeper](#deeper)');
	});

	it('converts special characters in anchors', async () => {
		const input = `## What's New?\n\n## API & Usage`;
		const result = await transform(input, ctx);
		expect(result).toContain('(#whats-new)');
		expect(result).toContain('(#api-usage)');
	});

	it('returns source unchanged when no headings exist', async () => {
		const input = 'Just some plain text.\nNo headings here.';
		const result = await transform(input, ctx);
		expect(result).toBe(input);
	});

	it('preserves original content after TOC', async () => {
		const input = `# Hello\n\nWorld.`;
		const result = await transform(input, ctx);
		expect(result).toContain('# Hello\n\nWorld.');
		expect(result.indexOf('## Table of Contents')).toBe(0);
	});
});
