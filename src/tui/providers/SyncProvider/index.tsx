import path from 'node:path';
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { runSync } from '../../../engine/pipeline.js';
import { resolveSourceType } from '../../../engine/resolver.js';
import type { SyncResult } from '../../../types/Status/index.js';
import type { SyncEntry } from '../../../types/Sync/index.js';
import { createLocalWatcher, createRemotePoller } from '../../../watcher/index.js';
import type { WatcherHandle } from '../../../watcher/index.js';
import type { PollerHandle } from '../../../watcher/index.js';
import { useConfig } from '../ConfigProvider/index.js';
import type { SyncContextValue, SyncProviderProps } from './SyncProvider.types.js';

const SyncContext = createContext<SyncContextValue | null>(null);

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
	const { config, configPath } = useConfig();
	const [results, setResults] = useState<Record<string, SyncResult>>({});
	const [isWatching, setIsWatching] = useState(false);

	const cwd = path.dirname(configPath);

	const syncOne = useCallback(
		async (id: string) => {
			if (!config) return;
			const entry = config.syncs.find((s) => s.id === id);
			if (!entry) return;

			setResults((prev) => ({
				...prev,
				[id]: { id, status: 'syncing' },
			}));

			try {
				const result = await runSync(entry, cwd);
				setResults((prev) => ({
					...prev,
					[id]: result,
				}));
			} catch (err) {
				setResults((prev) => ({
					...prev,
					[id]: {
						id,
						status: 'error',
						error: err instanceof Error ? err.message : String(err),
					},
				}));
			}
		},
		[config, cwd],
	);

	const syncAll = useCallback(async () => {
		if (!config) return;
		await Promise.allSettled(config.syncs.map((entry) => syncOne(entry.id)));
	}, [config, syncOne]);

	const toggleWatch = useCallback(() => {
		setIsWatching((prev) => !prev);
	}, []);

	const handlesRef = useRef<Array<WatcherHandle | PollerHandle>>([]);

	useEffect(() => {
		if (!isWatching || !config) return;

		const handles: Array<WatcherHandle | PollerHandle> = [];

		for (const entry of config.syncs) {
			const resolved = resolveSourceType(entry.source);
			const handleChange = () => { syncOne(entry.id); };

			if (resolved.type === 'local') {
				const sourcePath = path.resolve(cwd, resolved.value);
				handles.push(createLocalWatcher(sourcePath, handleChange));
			} else {
				const intervalMs = entry.strategy && 'poll' in entry.strategy
					? parsePollInterval(entry.strategy.poll)
					: 30_000;
				const remoteUrl = resolved.type === 'url' ? resolved.value : `${resolved.host}/${resolved.repo}`;
				handles.push(createRemotePoller(remoteUrl, intervalMs, handleChange));
			}
		}

		handlesRef.current = handles;

		return () => {
			for (const handle of handles) {
				handle.stop();
			}
			handlesRef.current = [];
		};
	}, [isWatching, config, cwd, syncOne]);

	return (
		<SyncContext.Provider value={{ results, syncOne, syncAll, isWatching, toggleWatch }}>
			{children}
		</SyncContext.Provider>
	);
};

export const useSyncContext = (): SyncContextValue => {
	const ctx = useContext(SyncContext);
	if (!ctx) throw new Error('useSyncContext must be used within SyncProvider');
	return ctx;
};

function parsePollInterval(poll: string): number {
	const match = poll.match(/^(\d+)(s|m|ms)?$/);
	if (!match) return 30_000;
	const value = Number(match[1]);
	const unit = match[2] ?? 'ms';
	if (unit === 's') return value * 1000;
	if (unit === 'm') return value * 60_000;
	return value;
}
