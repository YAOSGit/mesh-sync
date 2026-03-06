import fs from 'node:fs';
import path from 'node:path';
import {
	getBuiltinTransformerSource,
	isBuiltinId,
} from '../transformers/registry.js';
import type { SyncResult } from '../types/Status/index.js';
import type { SyncEntry } from '../types/Sync/index.js';
import type { TransformContext } from '../types/Transformer/index.js';
import { generateDiff } from '../utils/Diff/index.js';
import { logVerbose } from '../utils/Logger/index.js';
import { DEFAULT_TIMEOUT } from './engine.consts.js';
import { executeBundledTransformer, executeTransformer } from './executor.js';
import { fetchSource } from './fetcher.js';
import { resolveSourceType } from './resolver.js';
import { writeErrorMarker, writeTarget } from './writer.js';

export type SyncOptions = {
	dryRun?: boolean;
	previousHash?: string;
	previousEtag?: string;
};

export async function runSync(
	entry: SyncEntry,
	cwd: string,
	options?: SyncOptions,
): Promise<SyncResult & { hash?: string; etag?: string }> {
	const { dryRun, previousHash, previousEtag } = options ?? {};

	const context: TransformContext = {
		sourceId: entry.id,
		sourcePath: entry.source,
		targetPath: entry.target,
	};

	try {
		logVerbose(`[${entry.id}] Resolving source: ${entry.source}`);
		const resolved = resolveSourceType(entry.source);

		if (resolved.type === 'local') {
			resolved.value = path.resolve(cwd, resolved.value);
		}

		logVerbose(`[${entry.id}] Fetching source (type: ${resolved.type})`);
		const fetched = await fetchSource(resolved, previousHash, previousEtag);

		if (!fetched.changed) {
			logVerbose(`[${entry.id}] Content unchanged, skipping`);
			return {
				id: entry.id,
				status: 'synced',
				lastSyncedAt: new Date(),
				hash: fetched.hash,
				etag: fetched.etag,
			};
		}

		let output = fetched.content;

		const chain = entry.transformer
			? Array.isArray(entry.transformer)
				? entry.transformer
				: [entry.transformer]
			: [];

		for (const transformerId of chain) {
			logVerbose(`[${entry.id}] Applying transformer: ${transformerId}`);
			const timeout = entry.timeout ?? DEFAULT_TIMEOUT;
			if (isBuiltinId(transformerId)) {
				const bundled = getBuiltinTransformerSource(transformerId);
				output = await executeBundledTransformer(
					bundled,
					output,
					context,
					timeout,
				);
			} else {
				const transformerPath = path.resolve(cwd, transformerId);
				output = await executeTransformer(
					transformerPath,
					output,
					context,
					timeout,
				);
			}
		}

		const targetPath = path.resolve(cwd, entry.target);

		if (dryRun) {
			logVerbose(`[${entry.id}] Dry-run: computing diff`);
			let existing = '';
			try {
				existing = fs.readFileSync(targetPath, 'utf-8');
			} catch {
				// Target doesn't exist yet — diff against empty
			}
			const diff = generateDiff(existing, output);
			return {
				id: entry.id,
				status: 'synced',
				lastSyncedAt: new Date(),
				hash: fetched.hash,
				etag: fetched.etag,
				diff,
			};
		}

		logVerbose(`[${entry.id}] Writing target: ${entry.target}`);
		writeTarget(targetPath, output);

		return {
			id: entry.id,
			status: 'synced',
			lastSyncedAt: new Date(),
			hash: fetched.hash,
			etag: fetched.etag,
		};
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		const targetPath = path.resolve(cwd, entry.target);

		if (!dryRun) {
			writeErrorMarker(targetPath, {
				sourceId: entry.id,
				sourcePath: entry.source,
				error: errorMsg,
			});
		}

		return {
			id: entry.id,
			status: 'error',
			error: errorMsg,
		};
	}
}
