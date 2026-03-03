import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRemotePoller } from './remote-poller.js';

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('createRemotePoller', () => {
	it('returns a poller with stop method', () => {
		vi.useFakeTimers();
		const poller = createRemotePoller(
			'https://example.com/api',
			60_000,
			vi.fn(),
		);
		expect(poller).toHaveProperty('stop');
		poller.stop();
	});

	it('calls onChange on interval', () => {
		vi.useFakeTimers();
		const onChange = vi.fn();
		const poller = createRemotePoller(
			'https://example.com/api',
			1_000,
			onChange,
		);

		vi.advanceTimersByTime(1_000);
		expect(onChange).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(1_000);
		expect(onChange).toHaveBeenCalledTimes(2);

		poller.stop();
	});

	it('stops calling after stop()', () => {
		vi.useFakeTimers();
		const onChange = vi.fn();
		const poller = createRemotePoller(
			'https://example.com/api',
			1_000,
			onChange,
		);

		vi.advanceTimersByTime(1_000);
		expect(onChange).toHaveBeenCalledTimes(1);

		poller.stop();

		vi.advanceTimersByTime(5_000);
		expect(onChange).toHaveBeenCalledTimes(1);
	});
});
