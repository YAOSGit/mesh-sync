export function generateDiff(oldContent: string, newContent: string): string {
	const oldLines = oldContent.split('\n');
	const newLines = newContent.split('\n');

	const m = oldLines.length;
	const n = newLines.length;

	// Build LCS table
	const dp: number[][] = Array.from({ length: m + 1 }, () =>
		Array(n + 1).fill(0),
	);
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (oldLines[i - 1] === newLines[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	// Backtrack to produce diff lines
	const result: string[] = [];
	let i = m;
	let j = n;

	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
			result.push(` ${oldLines[i - 1]}`);
			i--;
			j--;
		// NOTE: The >= tie-break prefers additions (+) over deletions (-) when the
	// LCS scores are equal. Standard unified diff convention is the reverse (- before +).
	// This is a deliberate convention choice for this codebase.
	} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
			result.push(`+${newLines[j - 1]}`);
			j--;
		} else {
			result.push(`-${oldLines[i - 1]}`);
			i--;
		}
	}

	return result.reverse().join('\n');
}
