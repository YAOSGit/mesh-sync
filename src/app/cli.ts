#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { createCLI, fatalError, formatError, getExitCode, runIfMain } from '@yaos-git/toolkit/cli';
import { runSync } from '../engine/pipeline.js';
import { loadCache, saveCache } from '../utils/Cache/index.js';
import { loadConfig } from '../utils/Config/index.js';
import { setVerbose } from '../utils/Logger/index.js';

declare const __CLI_VERSION__: string;

const cwd = process.cwd();

function buildProgram() {
	const { program } = createCLI({
		name: 'mesh-sync',
		description: 'Keep files in sync across repositories with real-time transformations',
		version: __CLI_VERSION__,
	});

	function resolveConfigPath(): string {
		return path.resolve(cwd, program.opts().config);
	}

	program
		.option('-c, --config <path>', 'Path to config file', 'mesh.json')
		.option('--verbose', 'Show detailed pipeline steps');

	program
		.command('sync [id]')
		.description('Run syncs (all or by ID) and exit')
		.option('--dry-run', 'Preview changes without writing files')
		.option('--no-cache', 'Disable hash/etag caching')
		.option('--json', 'Output results as JSON (for CI/scripting)')
		.action(
			async (
				id: string | undefined,
				cmdOpts: { dryRun?: boolean; cache?: boolean; json?: boolean },
			) => {
				try {
					setVerbose(!!program.opts().verbose);
					const configPath = resolveConfigPath();
					const config = loadConfig(configPath);

					const entries = id
						? config.syncs.filter((s) => s.id === id)
						: config.syncs;

					if (entries.length === 0) {
						if (id) {
							fatalError(`No sync found with id "${id}"`);

							return;
						}
						console.log(chalk.yellow('No syncs defined in mesh.json'));
						return;
					}

					const useCache = cmdOpts.cache !== false;
					const cache = useCache
						? loadCache(cwd)
						: { version: 1 as const, entries: {} };

					if (!cmdOpts.json) {
						console.log(
							chalk.blue(
								`Syncing ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}...`,
							),
						);
					}

					const settled = await Promise.allSettled(
						entries.map((entry) => {
							const cached = cache.entries[entry.id];
							return runSync(entry, cwd, {
								dryRun: cmdOpts.dryRun,
								previousHash: cached?.hash,
								previousEtag: cached?.etag,
							});
						}),
					);

					let hasError = false;
					const jsonResults: Array<{
						id: string;
						status: string;
						error?: string;
						diff?: string;
						target: string;
					}> = [];

					for (let i = 0; i < settled.length; i++) {
						const entry = entries[i];
						const outcome = settled[i];

						if (outcome.status === 'rejected') {
							hasError = true;
							if (cmdOpts.json) {
								jsonResults.push({
									id: entry.id,
									status: 'error',
									error: String(outcome.reason),
									target: entry.target,
								});
							} else {
								console.error(chalk.red(`  ${entry.id}: ${outcome.reason}`));
							}
							continue;
						}

						const result = outcome.value;

						if (cmdOpts.json) {
							jsonResults.push({
								id: entry.id,
								status: result.status,
								error: result.error,
								diff: result.diff,
								target: entry.target,
							});
						} else if (result.status === 'error') {
							console.error(chalk.red(`  ${entry.id}: ${result.error}`));
						} else if (result.diff) {
							console.log(chalk.cyan(`  ${entry.id}: Diff preview:`));
							for (const line of result.diff.split('\n')) {
								if (line.startsWith('+')) {
									console.log(chalk.green(`    ${line}`));
								} else if (line.startsWith('-')) {
									console.log(chalk.red(`    ${line}`));
								} else {
									console.log(chalk.gray(`    ${line}`));
								}
							}
						} else {
							console.log(
								chalk.green(`  ${entry.id}: Synced -> ${entry.target}`),
							);
						}

						if (result.status === 'error') {
							hasError = true;
						}

						if (useCache && result.status === 'synced') {
							cache.entries[entry.id] = {
								hash: result.hash,
								etag: result.etag,
								lastSyncedAt: new Date().toISOString(),
							};
						}
					}

					if (cmdOpts.json) {
						console.log(JSON.stringify({ results: jsonResults }, null, 2));
					}

					if (useCache && !cmdOpts.dryRun) {
						saveCache(cwd, cache);
					}

					process.exitCode = hasError ? 1 : 0;
				} catch (err) {
					fatalError(formatError(err));
				}
			},
		);

	program
		.command('init')
		.description('Scaffold mesh.json and transformers/ directory')
		.action(() => {
			try {
				setVerbose(!!program.opts().verbose);
				const configPath = resolveConfigPath();

				if (fs.existsSync(configPath)) {
					fatalError('mesh.json already exists');
					return;
				}

				const starter = {
					syncs: [
						{
							id: 'example',
							source: './src/source.ts',
							target: './src/generated/output.ts',
							transformer: './transformers/example.ts',
							strategy: { manual: true },
						},
					],
				};

				const exampleTransformer = `/**
 * Example mesh-sync transformer.
 *
 * A transformer receives the source file content as a string
 * and returns the transformed output as a string.
 *
 * @param source - The raw source file content
 * @param context - Metadata: { sourceId, sourcePath, targetPath }
 * @returns The transformed content to write to the target
 */
const transform = (source: string, _context: { sourceId: string; sourcePath: string; targetPath: string }): string => {
\treturn source;
};
export default transform;
`;

				fs.mkdirSync(path.join(cwd, 'transformers'), { recursive: true });
				const examplePath = path.join(cwd, 'transformers', 'example.ts');
				if (!fs.existsSync(examplePath)) {
					fs.writeFileSync(examplePath, exampleTransformer);
				}
				fs.writeFileSync(configPath, JSON.stringify(starter, null, '\t'));
				console.log(
					chalk.green(
						'Created mesh.json, transformers/, and transformers/example.ts',
					),
				);
			} catch (err) {
				fatalError(formatError(err));
			}
		});

	program
		.command('list')
		.description('Show all sync entries')
		.action(() => {
			try {
				setVerbose(!!program.opts().verbose);
				const configPath = resolveConfigPath();
				const config = loadConfig(configPath);

				if (config.syncs.length === 0) {
					console.log(chalk.yellow('No syncs defined'));
					return;
				}

				for (const entry of config.syncs) {
					const transformer = entry.transformer
						? Array.isArray(entry.transformer)
							? entry.transformer.join(' -> ')
							: entry.transformer
						: 'passthrough';
					const strategy = entry.strategy
						? Object.keys(entry.strategy)[0]
						: 'manual';

					console.log(
						`${chalk.cyan(entry.id)}  ${entry.source} -> ${entry.target}  [${transformer}]  (${strategy})`,
					);
				}
			} catch (err) {
				fatalError(formatError(err));
			}
		});

	return program;
}

export async function runCLI(args: string[] = process.argv.slice(2)): Promise<void> {
	const program = buildProgram();
	try {
		await program.parseAsync(args, { from: 'user' });
	} catch (err) {
		if (err instanceof Error && 'exitCode' in err) {
			process.exitCode = getExitCode(err);
		} else {
			fatalError(formatError(err));
		}
	}
}

runIfMain(import.meta.url, () => runCLI());
