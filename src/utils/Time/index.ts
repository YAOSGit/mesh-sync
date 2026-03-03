const UNITS: Record<string, number> = {
	s: 1_000,
	m: 60_000,
	h: 3_600_000,
};

export function parseInterval(interval: string): number {
	const match = interval.match(/^(\d+)(s|m|h)$/);
	if (!match) {
		throw new Error(`Invalid interval "${interval}". Use format: 30s, 5m, 1h`);
	}

	const value = Number(match[1]);
	const unit = match[2];

	if (value <= 0) {
		throw new Error('Interval must be greater than zero');
	}

	return value * UNITS[unit];
}
