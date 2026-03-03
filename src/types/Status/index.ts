export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncResult {
	id: string;
	status: SyncStatus;
	error?: string;
	lastSyncedAt?: Date;
	diff?: string;
}
