import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isVerbose, logVerbose, setVerbose } from './index.js';

describe('logger', () => {
	let errorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		setVerbose(false);
	});

	afterEach(() => {
		errorSpy.mockRestore();
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
