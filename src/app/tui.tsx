#!/usr/bin/env node
import { render } from 'ink';
import { createCLI, fatalError, formatError, getExitCode, runIfMain } from '@yaos-git/toolkit/cli';
import App from './tui-index.js';

declare const __CLI_VERSION__: string;

async function runTUI(args: string[] = process.argv.slice(2)): Promise<void> {
	const { program } = createCLI({
		name: 'mesh-sync-tui',
		description: 'Interactive TUI for mesh-sync file synchronization',
		version: __CLI_VERSION__,
	});

	program
		.option('-c, --config <path>', 'Path to config file', 'mesh.json')
		.action((options: { config?: string }) => {
			render(<App configPath={options.config} />);
		});

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

runIfMain(import.meta.url, () => { runTUI() });
