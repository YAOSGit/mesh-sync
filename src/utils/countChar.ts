export function countChar(str: string, ch: string): number {
	let count = 0;
	for (const c of str) {
		if (c === ch) count++;
	}
	return count;
}
