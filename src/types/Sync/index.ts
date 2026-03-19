export type WatchStrategy = {
	watch: true;
};

export type PollStrategy = {
	poll: string;
};

export type ManualStrategy = {
	manual: true;
};

export type Strategy = WatchStrategy | PollStrategy | ManualStrategy;

export type SyncEntry = {
	id: string;
	source: string;
	transformer?: string | string[];
	target: string;
	strategy?: Strategy;
	timeout?: number;
};
