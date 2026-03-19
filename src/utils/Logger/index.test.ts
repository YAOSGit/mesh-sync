import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _resetLogger, isVerbose, logVerbose, setVerbose } from './index.js';

describe('logger', () => {
	let errorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		// Re-create the logger so it captures the spied console.error
		_resetLogger();
		setVerbose(false);
	});

	afterEach(() => {
		errorSpy.mockRestore();
		// Restore the logger with the real console.error
		_resetLogger();
	});

	it('does not log when verbose is off', () => {
		logVerbose('test message');
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it('logs when verbose is on', () => {
		setVerbose(true);
		logVerbose('test message');
		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy.mock.calls[0][0]).toContain('test message');
	});

	it('tracks verbose state', () => {
		expect(isVerbose()).toBe(false);
		setVerbose(true);
		expect(isVerbose()).toBe(true);
	});
});
