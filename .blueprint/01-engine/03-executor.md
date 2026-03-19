---
title: Transformer Executor
teleport:
  file: src/engine/executor.ts
  line: 9
  highlight: executeTransformer
---

# Worker Thread Isolation

The `executeTransformer` function at line 9 bundles a user-provided transformer file with esbuild, then runs it inside a Node.js worker thread for isolation. This prevents transformers from corrupting the main process.

## How it works

The bundled code is loaded in the worker via a data URL (`data:text/javascript;base64,...`). The worker expects a default export function that receives `(source, context)` and returns a string. A configurable timeout (default 30s) terminates workers that hang.

## Key functions

Builtin transformers skip the esbuild step via `executeBundledTransformer` since their code is already bundled. The worker uses temp files cleaned up after execution. Press `o` to see the worker setup.
