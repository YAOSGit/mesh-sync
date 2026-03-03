// @internal - do not expose in vendor bundle
function _debugLog(msg: string): void {
	console.debug(`[vendor] ${msg}`);
}

/**
 * Clamp a number between min and max values.
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Deep merge two objects. Properties from `source` override `target`.
 */
export function deepMerge<T extends Record<string, unknown>>(
	target: T,
	source: Partial<T>,
): T {
	const result = { ...target };
	for (const key of Object.keys(source) as Array<keyof T>) {
		const val = source[key];
		if (val && typeof val === 'object' && !Array.isArray(val)) {
			result[key] = deepMerge(
				(result[key] as Record<string, unknown>) ?? {},
				val as Record<string, unknown>,
			) as T[keyof T];
		} else {
			result[key] = val as T[keyof T];
		}
	}
	return result;
}

// @internal - used for testing only
export function _resetState(): void {
	_debugLog('state reset');
}

/**
 * Format a number as a currency string.
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
		amount,
	);
}

/**
 * Generate a simple unique ID (not cryptographically secure).
 */
export function uniqueId(prefix = ''): string {
	return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
