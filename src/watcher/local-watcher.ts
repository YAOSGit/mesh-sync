import { watch } from 'chokidar';

export type WatcherHandle = {
	stop: () => void;
};

export function createLocalWatcher(
	sourcePath: string,
	onChange: () => void,
): WatcherHandle {
	const watcher = watch(sourcePath, {
		ignoreInitial: true,
		awaitWriteFinish: { stabilityThreshold: 200 },
		ignored: [
			'**/.mesh-sync-cache.json',
			'**/mesh-sync-cache.json',
			'**/.mesh-sync-errors/**',
		],
	});

	watcher.on('change', onChange);

	return {
		stop: () => {
			watcher.close();
		},
	};
}
