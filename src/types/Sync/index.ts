export interface WatchStrategy {
	watch: true;
}

export interface PollStrategy {
	poll: string;
}

export interface ManualStrategy {
	manual: true;
}

export type Strategy = WatchStrategy | PollStrategy | ManualStrategy;

export interface SyncEntry {
	id: string;
	source: string;
	transformer?: string | string[];
	target: string;
	strategy?: Strategy;
	timeout?: number;
}
