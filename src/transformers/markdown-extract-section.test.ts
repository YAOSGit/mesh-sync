import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import transform from './markdown-extract-section.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('markdown-extract-section transformer', () => {
	const originalEnv = process.env.MESH_SYNC_SECTION;

	beforeEach(() => {
		delete process.env.MESH_SYNC_SECTION;
	});

	afterEach(() => {
		if (originalEnv !== undefined) {
			process.env.MESH_SYNC_SECTION = originalEnv;
		} else {
			delete process.env.MESH_SYNC_SECTION;
		}
	});

	it('extracts a named section by env var', () => {
		process.env.MESH_SYNC_SECTION = 'Installation';
		const input = `# README

## Installation

Run \`npm install\`.

## Usage

Import the module.`;
		const result = transform(input, ctx);
		expect(result).toBe('## Installation\n\nRun `npm install`.');
	});

	it('extracts first ## section when no env var is set', () => {
		const input = `# Project Title

Some intro text.

## Getting Started

Follow these steps.

## Contributing

Open a PR.`;
		const result = transform(input, ctx);
		expect(result).toBe('## Getting Started\n\nFollow these steps.');
	});

	it('returns comment when section is not found', () => {
		process.env.MESH_SYNC_SECTION = 'Nonexistent';
		const input = `# Title\n\n## Overview\n\nSome text.`;
		const result = transform(input, ctx);
		expect(result).toBe('<!-- section not found -->');
	});

	it('extracts section until end of file when no next heading', () => {
		process.env.MESH_SYNC_SECTION = 'Final';
		const input = `## First\n\nContent.\n\n## Final\n\nLast section content.\nMore lines.`;
		const result = transform(input, ctx);
		expect(result).toBe('## Final\n\nLast section content.\nMore lines.');
	});

	it('respects heading hierarchy — stops at same or higher level', () => {
		process.env.MESH_SYNC_SECTION = 'Details';
		const input = `## Details\n\nSome details.\n\n### Sub Detail\n\nNested.\n\n## Next Section\n\nOther.`;
		const result = transform(input, ctx);
		expect(result).toBe(
			'## Details\n\nSome details.\n\n### Sub Detail\n\nNested.',
		);
	});
});
