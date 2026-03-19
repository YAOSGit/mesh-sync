---
title: Sync Pipeline
teleport:
  file: src/engine/pipeline.ts
  line: 24
  highlight: runSync
---

# The Sync Pipeline

The `runSync` function at line 24 orchestrates the four-stage pipeline: resolve, fetch, transform, and write. It takes a `SyncEntry` and options (dry-run, caching) and returns a `SyncResult` with status, hash, and optional diff.

## Data flow

First, `resolveSourceType` classifies the source as local, HTTP, or git. Then `fetchSource` retrieves the content, checking cache hashes and ETags to skip unchanged files. The transformer chain runs each transformer sequentially via worker threads. Finally, `writeTarget` writes the output, or `generateDiff` previews changes in dry-run mode.

## How it works

On error, `writeErrorMarker` stamps the target file with a diagnostic comment so you can see which source and transformer failed. Press `o` to teleport to the pipeline entry point.
