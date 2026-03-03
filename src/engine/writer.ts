import fs from 'node:fs';
import path from 'node:path';

export function writeTarget(targetPath: string, content: string): void {
	const dir = path.dirname(targetPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const tempPath = `${targetPath}.${Date.now()}.tmp`;
	try {
		fs.writeFileSync(tempPath, content);
		fs.renameSync(tempPath, targetPath);
	} catch (error) {
		try {
			if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
		} catch {
			// Ignore cleanup errors
		}
		throw error;
	}
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

	const dir = path.dirname(targetPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	const marker = `// MESH-SYNC SYNC FAILED
// Source: ${info.sourcePath}
// Error: ${info.error}
// Timestamp: ${timestamp}${staleSection}
`;

	writeTarget(targetPath, marker);
}
