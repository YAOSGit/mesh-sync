import type React from 'react';
import type { SyncResult } from '../../../types/Status/index.js';

export type SyncContextValue = {
	results: Record<string, SyncResult>;
	syncOne: (id: string) => Promise<void>;
	syncAll: () => Promise<void>;
	isWatching: boolean;
	toggleWatch: () => void;
};

export type SyncProviderProps = {
	children: React.ReactNode;
};
