import fs from 'node:fs';
import { hashContent } from '../utils/Hash/index.js';
import { logVerbose } from '../utils/Logger/index.js';
import type { ResolvedSource } from './resolver.js';
import { gitSourceToRawUrl } from './resolver.js';

export type FetchResult = {
	content: string;
	changed: boolean;
	hash?: string;
	etag?: string;
};

export async function fetchSource(
	source: ResolvedSource,
	previousHash?: string,
	previousEtag?: string,
): Promise<FetchResult> {
	if (source.type === 'local') {
		return fetchLocal(source.value, previousHash);
	}
	if (source.type === 'git') {
		const rawUrl = gitSourceToRawUrl(source);
		const token = process.env.MESH_SYNC_GIT_TOKEN;
		return fetchRemote(rawUrl, previousEtag, token);
	}
	return fetchRemote(source.value, previousEtag);
}

function fetchLocal(filePath: string, previousHash?: string): FetchResult {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Source file not found: ${filePath}`);
	}

	logVerbose(`Reading local file: ${filePath}`);
	const content = fs.readFileSync(filePath, 'utf-8');
	const hash = hashContent(content);
	const changed = previousHash ? hash !== previousHash : true;
	logVerbose(`Local file hash: ${hash}, changed: ${changed}`);

	return { content, changed, hash };
}

async function fetchRemote(
	url: string,
	previousEtag?: string,
	authToken?: string,
): Promise<FetchResult> {
	const headers: Record<string, string> = {};
	if (previousEtag) {
		headers['If-None-Match'] = previousEtag;
	}
	if (authToken) {
		headers.Authorization = `Bearer ${authToken}`;
	}

	logVerbose(`Fetching remote: ${url}`);
	const response = await fetchWithRetry(url, { headers });

	if (response.status === 304) {
		logVerbose('ETag matched — content unchanged (304)');
		return { content: '', changed: false, etag: previousEtag };
	}

	if (!response.ok) {
		throw new Error(
			`Failed to fetch ${url}: ${response.status} ${response.statusText}`,
		);
	}

	const content = await response.text();
	const etag = response.headers.get('ETag') ?? undefined;
	const hash = hashContent(content);

	return { content, changed: true, hash, etag };
}

const RETRY_DELAYS = [500, 1000, 2000];

async function fetchWithRetry(
	url: string,
	options: RequestInit,
	retries = 3,
): Promise<Response> {
	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const response = await fetch(url, options);

			if (response.status >= 500 && attempt < retries) {
				logVerbose(
					`Server error ${response.status}, retrying (${attempt + 1}/${retries})...`,
				);
				await sleep(RETRY_DELAYS[attempt] ?? 2000);
				continue;
			}

			return response;
		} catch (err) {
			if (attempt < retries) {
				logVerbose(`Network error, retrying (${attempt + 1}/${retries})...`);
				await sleep(RETRY_DELAYS[attempt] ?? 2000);
				continue;
			}
			throw err;
		}
	}
	// Unreachable, but satisfies TypeScript
	throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
