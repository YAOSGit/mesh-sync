---
title: Source Fetcher
teleport:
  file: src/engine/fetcher.ts
  line: 14
  highlight: fetchSource
---

# Source Fetching

The `fetchSource` function at line 14 dispatches to `fetchLocal` or `fetchRemote` based on the resolved source type. Git sources are first converted to raw URLs via `gitSourceToRawUrl`.

## How it works

Local fetching reads the file, computes a SHA-256 hash, and compares against the previous hash to detect changes. Remote fetching uses `If-None-Match` headers with ETags for efficient cache validation, and includes retry logic with exponential backoff (500ms, 1s, 2s) for server errors. A 30-second timeout protects against hung connections.

## Key functions

The `FetchResult` carries `content`, `changed`, `hash`, and `etag` -- the pipeline uses these to decide whether to skip or proceed. Press `o` to teleport.
