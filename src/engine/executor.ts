import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import * as esbuild from 'esbuild';
import type { TransformContext } from '../types/Transformer/index.js';
import { DEFAULT_TIMEOUT } from './engine.consts.js';

export async function executeTransformer(
	transformerPath: string,
	source: string,
	context: TransformContext,
	timeout: number = DEFAULT_TIMEOUT,
): Promise<string> {
	const bundled = await bundleTransformer(transformerPath);
	return runInWorker(bundled, source, context, timeout);
}

export async function executeBundledTransformer(
	bundledCode: string,
	source: string,
	context: TransformContext,
	timeout: number = DEFAULT_TIMEOUT,
): Promise<string> {
	return runInWorker(bundledCode, source, context, timeout);
}

async function bundleTransformer(transformerPath: string): Promise<string> {
	const result = await esbuild.build({
		entryPoints: [transformerPath],
		bundle: true,
		write: false,
		format: 'esm',
		platform: 'node',
		target: 'esnext',
	});

	if (result.errors.length > 0) {
		throw new Error(
			`Failed to bundle transformer: ${result.errors.map((e) => e.text).join(', ')}`,
		);
	}

	return result.outputFiles[0].text;
}

function runInWorker(
	bundledCode: string,
	source: string,
	context: TransformContext,
	timeout: number,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const workerSource = `
import { parentPort, workerData } from 'node:worker_threads';

async function run() {
	const { bundledCode, source, context } = workerData;
	const dataUrl = 'data:text/javascript;base64,' + Buffer.from(bundledCode).toString('base64');
	const mod = await import(dataUrl);
	const transform = mod.default;
	if (typeof transform !== 'function') {
		throw new Error('Transformer must export a default function');
	}
	const result = await transform(source, context);
	if (typeof result !== 'string') {
		throw new Error('Transformer must return a string, got ' + typeof result);
	}
	parentPort.postMessage({ type: 'result', data: result });
}

run().catch((err) => {
	parentPort.postMessage({ type: 'error', data: err instanceof Error ? err.message : String(err) });
});
`;
		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mesh-sync-worker-'));
		const workerPath = path.join(tmpDir, 'worker.mjs');
		fs.writeFileSync(workerPath, workerSource);

		const worker = new Worker(workerPath, {
			workerData: { bundledCode, source, context },
		});

		let settled = false;

		const timer = setTimeout(() => {
			if (!settled) {
				settled = true;
				worker.terminate();
				cleanup();
				reject(new Error(`Transformer timed out after ${timeout}ms`));
			}
		}, timeout);

		function cleanup() {
			try {
				fs.unlinkSync(workerPath);
				fs.rmdirSync(tmpDir);
			} catch {
				// Ignore cleanup errors
			}
		}

		worker.on('message', (msg: { type: string; data: string }) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			worker.terminate();
			cleanup();
			if (msg.type === 'result') {
				resolve(msg.data);
			} else {
				reject(new Error(msg.data));
			}
		});

		worker.on('error', (err) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			cleanup();
			reject(err);
		});

		worker.on('exit', (code) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			cleanup();
			if (code !== 0) {
				reject(new Error(`Worker exited with code ${code}`));
			}
		});
	});
}
