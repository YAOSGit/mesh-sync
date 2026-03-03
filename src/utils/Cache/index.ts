import fs from 'node:fs';
import path from 'node:path';

export type CacheEntry = {
	hash?: string;
	etag?: string;
	lastSyncedAt?: string;
};

export type CacheFile = {
	version: 1;
	entries: Record<string, CacheEntry>;
};

const CACHE_FILENAME = '.mesh-sync-cache.json';

function cachePath(cwd: string): string {
	return path.join(cwd, CACHE_FILENAME);
}

export function loadCache(cwd: string): CacheFile {
	const filePath = cachePath(cwd);
	try {
		if (!fs.existsSync(filePath)) {
			return { version: 1, entries: {} };
		}
		const raw = fs.readFileSync(filePath, 'utf-8');
		const parsed = JSON.parse(raw);
		if (parsed?.version === 1 && typeof parsed.entries === 'object') {
			return parsed as CacheFile;
		}
		return { version: 1, entries: {} };
	} catch {
		return { version: 1, entries: {} };
	}
}

export function saveCache(cwd: string, cache: CacheFile): void {
	const filePath = cachePath(cwd);
	fs.writeFileSync(filePath, JSON.stringify(cache, null, '\t'));
}
