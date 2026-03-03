import chalk from 'chalk';

let verbose = false;

export function setVerbose(v: boolean): void {
	verbose = v;
}

export function isVerbose(): boolean {
	return verbose;
}

export function logVerbose(msg: string): void {
	if (verbose) console.error(chalk.dim(`[mesh-sync] ${msg}`));
}
