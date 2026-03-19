import path from 'node:path';
import type React from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { runSync } from '../../../engine/pipeline.js';
import type { SyncResult } from '../../../types/Status/index.js';
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
