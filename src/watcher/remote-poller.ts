// The poller is timer-only by design; the actual fetch happens in
// handleSync → runSync → fetchSource. The url param is reserved for
// future conditional polling (e.g., HEAD request change detection).
export type PollerHandle = {
	stop: () => void;
};

export function createRemotePoller(
	_url: string,
	intervalMs: number,
	onChange: () => void,
): PollerHandle {
	const id = setInterval(onChange, intervalMs);

	return {
		stop: () => {
			clearInterval(id);
		},
	};
}
