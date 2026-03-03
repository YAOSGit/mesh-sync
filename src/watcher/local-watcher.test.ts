import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalWatcher } from './local-watcher.js';

vi.mock('chokidar', () => {
	return {
		watch: vi.fn(() => ({
			on: vi.fn().mockReturnThis(),
			close: vi.fn(),
		})),
	};
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('createLocalWatcher', () => {
	it('returns a watcher with stop method', () => {
		const watcher = createLocalWatcher('./src.ts', vi.fn());
		expect(watcher).toHaveProperty('stop');
		expect(typeof watcher.stop).toBe('function');
	});

	it('stop calls close on chokidar watcher', () => {
		const watcher = createLocalWatcher('./src.ts', vi.fn());
		watcher.stop();
	});
});
