import { createLogger } from '@yaos-git/toolkit/cli/logger';
import { createCLITheme } from '@yaos-git/toolkit/theme';

const theme = createCLITheme('#8514CA');

let verbose = false;
let logger = createLogger({ prefix: 'mesh-sync', theme, stderr: true });

export function setVerbose(v: boolean): void {
	verbose = v;
	logger.setVerbose(v);
}

export function isVerbose(): boolean {
	return verbose;
}

export function logVerbose(msg: string): void {
	logger.verbose(msg);
}

/**
 * Re-create the logger instance. Used in tests to pick up
 * spied `console.error` references.
 * @internal
 */
export function _resetLogger(): void {
	logger = createLogger({ prefix: 'mesh-sync', theme, stderr: true });
	logger.setVerbose(verbose);
}
