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
	});

	watcher.on('change', onChange);

	return {
		stop: () => {
			watcher.close();
		},
	};
}
