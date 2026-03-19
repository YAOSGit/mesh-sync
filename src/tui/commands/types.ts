import type { BaseDeps, Command } from '@yaos-git/toolkit/types';
import type { UseUIStateReturn } from '../hooks/useUIState/index.js';

export type MeshSyncDeps = BaseDeps & {
	ui: UseUIStateReturn;
	isWatching: boolean;
};

export type MeshSyncCommand = Command<MeshSyncDeps>;
