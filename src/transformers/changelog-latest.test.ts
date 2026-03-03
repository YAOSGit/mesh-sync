import { describe, expect, it } from 'vitest';
import transform from './changelog-latest.js';

const ctx = { sourceId: 'test', sourcePath: '', targetPath: '' };

describe('changelog-latest transformer', () => {
	it('extracts the latest version entry', () => {
		const input = `# Changelog

## [2.0.0] - 2024-06-01

### Added
- New feature

## [1.0.0] - 2024-01-01

### Added
- Initial release`;
		const result = transform(input, ctx);
		expect(result).toContain('## [2.0.0] - 2024-06-01');
		expect(result).toContain('### Added');
		expect(result).toContain('- New feature');
		expect(result).not.toContain('## [1.0.0]');
	});

	it('handles version headings without brackets', () => {
		const input = `# Changelog\n\n## 3.1.0\n\n- Bug fix\n\n## 3.0.0\n\n- Breaking change`;
		const result = transform(input, ctx);
		expect(result).toContain('## 3.1.0');
		expect(result).toContain('- Bug fix');
		expect(result).not.toContain('## 3.0.0');
	});

	it('extracts to end of file when only one version exists', () => {
		const input = `# Changelog\n\n## [1.0.0]\n\n### Added\n\n- Everything`;
		const result = transform(input, ctx);
		expect(result).toBe('## [1.0.0]\n\n### Added\n\n- Everything');
	});

	it('returns source unchanged when no version heading is found', () => {
		const input = `# Notes\n\nThis has no version entries.`;
		const result = transform(input, ctx);
		expect(result).toBe(input);
	});

	it('handles prerelease version tags', () => {
		const input = `# Changelog\n\n## [2.0.0-beta.1] - 2024-03-01\n\n- Beta stuff\n\n## [1.0.0] - 2024-01-01\n\n- Stable`;
		const result = transform(input, ctx);
		expect(result).toContain('## [2.0.0-beta.1]');
		expect(result).toContain('- Beta stuff');
		expect(result).not.toContain('## [1.0.0]');
	});
});
