import fs from 'node:fs';
import path from 'node:path';
import type { Config } from '../../types/Config/index.js';
import { parseInterval } from '../Time/index.js';

function isCustomTransformerPath(t: string): boolean {
	return t.startsWith('./') || t.startsWith('../') || t.startsWith('/');
}

export function validateConfig(rawObj: unknown): asserts rawObj is Config {
	if (!rawObj || typeof rawObj !== 'object') {
		throw new Error('Config root must be an object');
	}

	const config = rawObj as Record<string, unknown>;

	if (!Array.isArray(config.syncs)) {
		throw new Error('Config must have a "syncs" array');
	}

	const seenIds = new Set<string>();
	const seenTargets = new Set<string>();

	for (const [i, entry] of config.syncs.entries()) {
		if (!entry || typeof entry !== 'object') {
			throw new Error(`Sync entry ${i} must be an object`);
		}

		const sync = entry as Record<string, unknown>;

		if (typeof sync.id !== 'string' || !sync.id) {
			throw new Error(`Sync entry ${i} must have an "id" string`);
		}

		if (seenIds.has(sync.id)) {
			throw new Error(`Duplicate sync id "${sync.id}"`);
		}
		seenIds.add(sync.id);

		if (typeof sync.source !== 'string' || !sync.source) {
			throw new Error(`Sync "${sync.id}" must have a "source" string`);
		}

		if (typeof sync.target !== 'string' || !sync.target) {
			throw new Error(`Sync "${sync.id}" must have a "target" string`);
		}

		if (sync.source === sync.target) {
			throw new Error(
				`Sync "${sync.id}" source and target must not be the same path`,
			);
		}

		if (seenTargets.has(sync.target as string)) {
			throw new Error(
				`Duplicate target "${sync.target}" — multiple syncs cannot write to the same file`,
			);
		}
		seenTargets.add(sync.target as string);

		if (sync.transformer !== undefined) {
			const t = sync.transformer;
			if (typeof t !== 'string' && !Array.isArray(t)) {
				throw new Error(
					`Sync "${sync.id}" transformer must be a string or array of strings`,
				);
			}
			if (Array.isArray(t) && !t.every((s) => typeof s === 'string')) {
				throw new Error(
					`Sync "${sync.id}" transformer array must contain only strings`,
				);
			}
		}

		if (sync.strategy !== undefined) {
			if (!sync.strategy || typeof sync.strategy !== 'object') {
				throw new Error(`Sync "${sync.id}" strategy must be an object`);
			}

			const strategy = sync.strategy as Record<string, unknown>;
			const keys = Object.keys(strategy);

			if (keys.length !== 1) {
				throw new Error(
					`Sync "${sync.id}" strategy must have exactly one key: watch, poll, or manual`,
				);
			}

			if (!['watch', 'poll', 'manual'].includes(keys[0])) {
				throw new Error(
					`Sync "${sync.id}" strategy key must be watch, poll, or manual`,
				);
			}

			if (keys[0] === 'poll') {
				try {
					parseInterval(strategy.poll as string);
				} catch {
					throw new Error(
						`Sync "${sync.id}" has invalid poll interval "${strategy.poll}"`,
					);
				}
			}
		}

		if (sync.timeout !== undefined && typeof sync.timeout !== 'number') {
			throw new Error(`Sync "${sync.id}" timeout must be a number`);
		}
	}
}

export function loadConfig(filePath: string): Config {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Config file not found: ${filePath}`);
	}

	const raw = fs.readFileSync(filePath, 'utf-8');
	const parsed = JSON.parse(raw);
	validateConfig(parsed);

	const cwd = path.dirname(filePath);
	for (const sync of parsed.syncs) {
		const transformers = sync.transformer
			? Array.isArray(sync.transformer)
				? sync.transformer
				: [sync.transformer]
			: [];

		for (const t of transformers) {
			if (isCustomTransformerPath(t)) {
				const resolved = path.resolve(cwd, t);
				if (!fs.existsSync(resolved)) {
					throw new Error(`Sync "${sync.id}" transformer not found: ${t}`);
				}
			}
		}
	}

	return parsed;
}
