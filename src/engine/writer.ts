import fs from 'node:fs';
import path from 'node:path';
import { atomicWrite } from '@yaos-git/toolkit/cli';

export function writeTarget(targetPath: string, content: string): void {
	const dir = path.dirname(targetPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	atomicWrite(targetPath, content);
}

const ERROR_MARKER_DIR = '.mesh-sync-errors';

export function errorMarkerDir(cwd: string): string {
	return path.join(cwd, ERROR_MARKER_DIR);
}

export function writeErrorMarker(
	targetPath: string,
	info: { sourceId: string; sourcePath: string; error: string },
): void {
	const timestamp = new Date().toISOString();
	let staleSection = '';

	if (fs.existsSync(targetPath)) {
		const previous = fs.readFileSync(targetPath, 'utf-8');
		if (previous && !previous.includes('MESH-SYNC SYNC FAILED')) {
			staleSection = `\n// --- STALE OUTPUT (last successful: ${timestamp}) ---\n${previous}`;
		}
	}

	const marker = `// MESH-SYNC SYNC FAILED
// Source: ${info.sourcePath}
// Error: ${info.error}
// Timestamp: ${timestamp}${staleSection}
`;

	// Write error markers to a separate directory to avoid triggering
	// the file watcher and causing an infinite re-sync feedback loop.
	const errorDir = path.join(path.dirname(targetPath), ERROR_MARKER_DIR);
	if (!fs.existsSync(errorDir)) {
		fs.mkdirSync(errorDir, { recursive: true });
	}
	const markerPath = path.join(errorDir, path.basename(targetPath));
	fs.writeFileSync(markerPath, marker, 'utf-8');
}
