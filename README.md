<p align="center">
  <a href="https://github.com/YAOSGit/mesh-sync">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/YAOSGit/.github/main/images/mesh-sync.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/YAOSGit/.github/main/images/mesh-sync-light.svg">
      <img src="https://raw.githubusercontent.com/YAOSGit/.github/main/images/mesh-sync.svg" width="100%" alt="mesh-sync" />
    </picture>
  </a>
</p>

<p align="center">
  <strong>Cross-repo file sync with real-time transformations</strong>
</p>

<div align="center">

![Node Version](https://img.shields.io/badge/NODE-18+-16161D?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=%23FF0088)
![TypeScript Version](https://img.shields.io/badge/TYPESCRIPT-5.9-16161D?style=for-the-badge&logo=typescript&logoColor=white&labelColor=%23FF0088)
![Uses Vitest](https://img.shields.io/badge/VITEST-16161D?style=for-the-badge&logo=vitest&logoColor=white&labelColor=%23FF0088)
![Uses Biome](https://img.shields.io/badge/BIOME-16161D?style=for-the-badge&logo=biome&logoColor=white&labelColor=%23FF0088)

</div>

---

## Table of Contents

### Getting Started

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [CLI Usage](#cli-usage)

### Configuration

- [Config Format (mesh.json)](#config-format-meshjson)
- [Source Types](#source-types)
- [Strategies](#strategies)

### Transformers

- [Writing Transformers](#writing-transformers)
- [Built-in Transformers](#built-in-transformers)
- [Chaining Transformers](#chaining-transformers)

### TUI Dashboard

- [TUI Dashboard](#tui-dashboard)

### Development

- [Available Scripts](#available-scripts)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)

---

## Overview

**mesh-sync** keeps files in sync across independent repositories with optional transformations. Define what to sync in a `mesh.json` config, optionally transform the content through a pipeline, and run it headless in CI or interactively via a TUI dashboard.

### What Makes This Project Unique

- **Three source types**: Local files, HTTP URLs (with ETag caching), and git repositories (GitHub, GitLab, Bitbucket)
- **Worker thread sandbox**: Transformers run in isolated Worker threads — a rogue transformer can't crash the main process
- **Transformer chaining**: Pipe content through multiple transformers in sequence
- **Error markers**: On failure, target files get a `// MESH-SYNC SYNC FAILED` header that breaks downstream builds loudly, preserving stale content below
- **Atomic writes**: Uses temp file + rename to prevent partial writes
- **Interactive TUI**: `mesh-sync-tui` provides a full terminal UI for browsing, editing, and syncing entries
- **CI-friendly**: `mesh-sync sync` runs headless with JSON output for scripting

---

## Installation

```bash
# Install globally from npm
npm install -g @yaos-git/mesh-sync

# Or install as a dev dependency
npm install -D @yaos-git/mesh-sync
```

This installs two binaries: `mesh-sync` (headless CLI) and `mesh-sync-tui` (interactive terminal UI).

### From Source

```bash
# Clone the repository
git clone https://github.com/YAOSGit/mesh-sync.git
cd mesh-sync

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

---

## Quick Start

1. Scaffold a starter config:

```bash
mesh-sync init
```

> **Note:** This creates a `mesh.json` file and a `transformers/` directory in the current working directory.

2. Edit `mesh.json` to define your syncs:

```json
{
  "syncs": [
    {
      "id": "shared-types",
      "source": "../core-lib/src/types.ts",
      "target": "./src/vendor/types.ts"
    }
  ]
}
```

3. Run it:

```bash
mesh-sync sync
# Synced: ./src/vendor/types.ts
```

---

## CLI Usage

```text
mesh-sync sync [id]        Run all syncs (or one by ID), exit 0 on success / 1 on error
mesh-sync init             Scaffold mesh.json and transformers/ directory
mesh-sync list             Show all sync entries with source, target, transformer, strategy
mesh-sync --help           Show help message
mesh-sync --version        Show version information

mesh-sync-tui [-c, --config <path>]   Launch interactive TUI (defaults to ./mesh.json)
```

### Examples

```bash
# Sync everything
mesh-sync sync

# Sync a single entry by ID
mesh-sync sync external-api

# Preview what's configured
mesh-sync list
```

---

## Config Format (mesh.json)

```json
{
  "syncs": [
    {
      "id": "external-api",
      "source": "https://api.example.com/swagger.json",
      "transformer": "openapi-to-types",
      "target": "./src/generated/api.ts",
      "strategy": { "poll": "5m" }
    },
    {
      "id": "shared-types",
      "source": "git://github.com/org/core-lib#main:src/types.ts",
      "transformer": ["strip-comments", "./transformers/add-header.ts"],
      "target": "./src/vendor/types.ts",
      "strategy": { "poll": "5m" }
    },
    {
      "id": "raw-copy",
      "source": "../shared/constants.ts",
      "target": "./src/vendor/constants.ts",
      "strategy": { "watch": true }
    }
  ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Unique identifier for the sync entry |
| `source` | yes | Local path, HTTP/HTTPS URL, or `git://` URI |
| `transformer` | no | Built-in name, file path, or array for chaining. Omit for passthrough copy |
| `target` | yes | Output file path (relative to cwd) |
| `strategy` | no | `{ "watch": true }`, `{ "poll": "5m" }`, or `{ "manual": true }` (default) |
| `timeout` | no | Worker thread timeout in ms (default: 30000) |

---

## Source Types

### Local files

Relative or absolute paths. Relative paths are resolved from the directory containing `mesh.json`.

```json
{ "source": "./src/shared/types.ts" }
{ "source": "../core-lib/utils/auth.ts" }
{ "source": "/usr/local/share/data.json" }
```

### URLs

Any HTTP/HTTPS endpoint. Supports ETag-based caching — on subsequent syncs, the server can respond with `304 Not Modified` to skip unchanged content.

```json
{ "source": "https://api.example.com/swagger.json" }
```

### Git repositories

Files from any branch, tag, or commit in GitHub, GitLab, or Bitbucket repositories.

**Format:** `git://host/org/repo#ref:path/to/file`

```json
{ "source": "git://github.com/org/core-lib#main:src/types.ts" }
{ "source": "git://gitlab.com/org/repo#v2.0:lib/utils.ts" }
{ "source": "git://bitbucket.org/org/repo#develop:config.json" }
```

For private repositories, set a personal access token:

```bash
export MESH_SYNC_GIT_TOKEN=ghp_your_token_here
mesh-sync sync
```

The token is sent as a `Bearer` authorization header when fetching from `git://` sources.

---

## Strategies

Each sync entry can specify a strategy for when it runs:

| Strategy | Syntax | Description |
|----------|--------|-------------|
| **manual** | `{ "manual": true }` | Only runs via `mesh-sync sync` or TUI keystroke (default) |
| **watch** | `{ "watch": true }` | Resyncs on file system changes via chokidar (local sources only) |
| **poll** | `{ "poll": "5m" }` | Timed interval with ETag/hash caching. Accepts `"30s"`, `"5m"`, `"1h"` |

If no strategy is specified, the sync defaults to **manual**.

---

## Writing Transformers

Transformers are TypeScript files that export a default function. The function receives the source content as a string and a context object with metadata about the sync:

```typescript
import type { TransformContext } from '@yaos-git/mesh-sync';

// transformers/add-header.ts
const transform = (source: string, context: TransformContext) => {
  return `// Synced from ${context.sourcePath} - DO NOT EDIT\n\n${source}`;
};
export default transform;
```

### TransformContext

| Field | Type | Description |
|-------|------|-------------|
| `sourceId` | `string` | The `id` of the sync entry |
| `sourcePath` | `string` | The raw `source` value from config |
| `targetPath` | `string` | The `target` path from config |

Transformers can return a `string` or `Promise<string>` for async operations.

Transformers run in isolated Worker threads — esbuild bundles the `.ts` file on-the-fly, then the bundled code executes in a Worker with a configurable timeout (default 30s). This means a slow or crashing transformer cannot bring down the main process.

---

## Built-in Transformers

Reference built-in transformers by their ID (no file path needed). mesh-sync ships 62 built-in transformers across 8 categories.

### Core

| ID | Description |
|----|-------------|
| `passthrough` | Returns the source content unchanged (used internally when no transformer is specified) |
| `strip-comments` | Removes `// @internal` lines and `/** @private */` JSDoc blocks |
| `json-to-ts` | Converts JSON to a `const` TypeScript export, using the sync ID as the variable name |
| `openapi-to-types` | Converts OpenAPI/Swagger JSON (`components.schemas`) to TypeScript type declarations |

### Content Filters

| ID | Description |
|----|-------------|
| `strip-exports` | Removes the `export` keyword from all declarations |
| `extract-types` | Keeps only `type`, `interface`, `enum`, and `import type` declarations |
| `strip-tests` | Removes `describe`/`it`/`test` blocks and test framework imports |
| `strip-imports` | Removes all `import` and `require` statements |
| `strip-jsdoc` | Removes `/** ... */` JSDoc comment blocks |
| `keep-exported` | Keeps only exported declarations and imports (inverse of `strip-exports`) |

### Format Converters

| ID | Description |
|----|-------------|
| `yaml-to-json` | Converts YAML to JSON (inline parser, no dependencies) |
| `json-to-yaml` | Converts JSON to YAML format |
| `toml-to-json` | Converts TOML to JSON (inline parser) |
| `csv-to-json` | Converts CSV to JSON array of objects (first row = headers) |
| `xml-to-json` | Converts XML to JSON (attributes in `@attributes`, text in `#text`) |
| `markdown-to-html` | Converts Markdown to HTML (headings, bold, italic, code, links, lists) |
| `env-to-ts` | Converts `.env` file to TypeScript type + typed const object |
| `json-to-zod` | Converts JSON Schema to Zod schema code |
| `json-to-env` | Converts flat/nested JSON to `.env` format |

### API Contract Transformers

| ID | Description |
|----|-------------|
| `graphql-to-types` | Converts GraphQL SDL to TypeScript types and enums |
| `protobuf-to-types` | Converts `.proto` message definitions to TypeScript types |
| `json-schema-to-types` | Converts JSON Schema to TypeScript types (supports `$ref`, `allOf`, `oneOf`) |
| `openapi-to-routes` | Extracts a typed route map constant from OpenAPI spec |
| `openapi-to-mock` | Generates mock data objects from OpenAPI schema definitions |
| `openapi-to-fetch` | Generates typed fetch wrapper functions from OpenAPI spec |
| `asyncapi-to-types` | Converts AsyncAPI spec to TypeScript message/channel types |

### Code Transformers

| ID | Description |
|----|-------------|
| `add-banner` | Prepends an "AUTO-GENERATED — DO NOT EDIT" header with source info |
| `add-eslint-disable` | Prepends `/* eslint-disable */` (skips if already present) |
| `wrap-namespace` | Wraps content in a TypeScript namespace (PascalCase of sync ID) |
| `wrap-module` | Wraps content in `declare module '<sourceId>'` |
| `rename-exports` | Renames exports using `MESH_SYNC_RENAME_MAP` env var (JSON map) |
| `minify` | Minifies JSON (compact stringify) or strips whitespace for other formats |
| `prettify-json` | Pretty-prints JSON with tab indentation |
| `cjs-to-esm` | Rewrites CommonJS `require`/`module.exports` to ESM `import`/`export` |

### Infrastructure / Config

| ID | Description | Config |
|----|-------------|--------|
| `env-filter` | Filters `.env` lines by key prefix | `MESH_SYNC_ENV_PREFIX` (default: `PUBLIC_`) |
| `json-pick` | Picks specific keys from JSON | `MESH_SYNC_PICK` (comma-separated keys) |
| `json-omit` | Omits specific keys from JSON | `MESH_SYNC_OMIT` (comma-separated keys) |
| `json-merge` | Deep-merges source JSON with a base object | `MESH_SYNC_MERGE_BASE` (JSON string) |
| `json-flatten` | Flattens nested JSON to dot-notation keys | — |
| `template` | Replaces `{{KEY}}` placeholders with env var values | Uses `process.env[KEY]` |
| `dotenv-to-docker` | Converts `.env` to docker-compose `environment:` YAML | — |

### Content Processing

| ID | Description | Config |
|----|-------------|--------|
| `head` | Keeps first N lines | `MESH_SYNC_LINES` (default: `20`) |
| `tail` | Keeps last N lines | `MESH_SYNC_LINES` (default: `20`) |
| `truncate` | Keeps first N lines with `// ... truncated` marker | `MESH_SYNC_LINES` (default: `50`) |
| `slice` | Extracts content between `// mesh-sync:start` and `// mesh-sync:end` markers | — |
| `sort-lines` | Sorts lines alphabetically (case-insensitive) | — |
| `dedupe-lines` | Removes duplicate lines (keeps first occurrence) | — |
| `replace` | Applies regex replacement | `MESH_SYNC_REPLACE_PATTERN`, `MESH_SYNC_REPLACE_WITH` |
| `wrap` | Adds prefix and/or suffix to content | `MESH_SYNC_WRAP_PREFIX`, `MESH_SYNC_WRAP_SUFFIX` |

### Security / Sanitization

| ID | Description | Config |
|----|-------------|--------|
| `redact-secrets` | Replaces detected secrets (API keys, tokens, private keys) with `[REDACTED]` | — |
| `redact-keys` | Redacts values of specific JSON keys | `MESH_SYNC_REDACT_KEYS` (comma-separated, defaults to common sensitive keys) |
| `strip-env-values` | Strips values from `.env` (keeps keys only, useful for `.env.example`) | — |
| `mask-emails` | Masks email addresses (`u***@e*****.com`) | — |
| `hash-values` | Replaces JSON string values with their SHA-256 hash (first 16 hex chars) | — |
| `validate-no-secrets` | Throws an error if secrets are detected (pipeline gate) | — |

### Documentation / Markdown

| ID | Description | Config |
|----|-------------|--------|
| `markdown-extract-section` | Extracts a specific heading section | `MESH_SYNC_SECTION` (default: first `##`) |
| `markdown-toc` | Generates and prepends a Table of Contents | — |
| `markdown-strip-badges` | Removes badge image links (shields.io, etc.) | — |
| `markdown-to-plaintext` | Strips all Markdown formatting to plain text | — |
| `markdown-rewrite-links` | Rewrites relative links to absolute URLs | `MESH_SYNC_BASE_URL` |
| `changelog-latest` | Extracts the latest version entry from a CHANGELOG | — |

### Examples

```json
{ "transformer": "openapi-to-types" }
{ "transformer": "strip-comments" }
{ "transformer": "json-to-ts" }
{ "transformer": "redact-secrets" }
{ "transformer": ["yaml-to-json", "json-pick", "add-banner"] }
```

---

## Chaining Transformers

Pass an array to pipe content through multiple transformers in sequence. Each transformer's output becomes the next one's input:

```json
{
  "transformer": ["strip-comments", "./transformers/add-header.ts"]
}
```

This first strips `@internal`/`@private` annotations, then prepends a header comment. You can mix built-in IDs and custom file paths freely.

---

## TUI Dashboard

Launch with `mesh-sync-tui` (or `mesh-sync-tui -c path/to/mesh.json` for a custom config path).

The TUI provides a **SplitPane layout**: an entry list in the top panel and a 3-column detail view in the bottom panel.

### 3-Column Detail View

```
SOURCE file tree  -->  TRANSFORMERS chain  -->  TARGET file tree
```

- **Source**: file tree visualization of the source path
- **Transformers**: ordered chain with add/remove/reorder controls
- **Target**: file tree visualization of the target path

### Browse Mode

Navigate the entry list and perform bulk operations.

| Key | Action |
|-----|--------|
| `Up` / `Down` | Navigate entries |
| `s` | Sync selected entry |
| `S` | Sync all entries |
| `w` | Toggle watch mode |
| `n` | Create new sync entry |
| `d` | Delete selected entry |
| `Enter` | Enter detail mode for selected entry |
| `?` | Help menu |

### Detail Mode

Edit the selected sync entry's source, target, and transformer chain.

| Key | Action |
|-----|--------|
| `Enter` | Edit source or target path |
| `a` | Add transformer (picker with type-to-filter) |
| `d` | Remove selected transformer |
| `j` / `k` | Reorder transformer in chain |
| `Esc` | Return to browse mode |

### Pickers

- **Source type picker**: choose between local / HTTP / git with prefilled prefixes
- **Strategy picker**: manual / watch / poll (5s, 10s, 30s, 1m, 5m)
- **Transformer picker**: browse all 62 built-in transformers plus auto-discovered local transformers from `transformers/` directories

---

## Available Scripts

### Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run all dev scripts concurrently via run-tui |
| `npm run dev:typescript` | Run TypeScript type checking in watch mode |
| `npm run dev:test` | Run unit tests in watch mode |

### Build Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Bundle CLI and TUI with esbuild (`dist/cli.js`, `dist/tui.js`) |

### Lint Scripts

| Script | Description |
|--------|-------------|
| `npm run lint` | Run type checking, linting, formatting, and audit |
| `npm run lint:check` | Check code for linting issues with Biome |
| `npm run lint:fix` | Check and fix linting issues with Biome |
| `npm run lint:format` | Format all files with Biome |
| `npm run lint:types` | Run TypeScript type checking only |
| `npm run lint:audit` | Run npm audit |

### Testing Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests (unit, type, e2e) |
| `npm run test:unit` | Run unit tests |
| `npm run test:types` | Run type-level tests |
| `npm run test:e2e` | Build and run end-to-end tests |

---

## Tech Stack

### Core

- **[TypeScript 5.9](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Commander](https://github.com/tj/commander.js)** - CLI argument parsing
- **[esbuild](https://esbuild.github.io/)** - Bundler (build-time and runtime transformer bundling)
- **[chokidar](https://github.com/paulmillr/chokidar)** - File system watching
- **[Chalk](https://github.com/chalk/chalk)** - Terminal string styling

### TUI

- **[React 19](https://react.dev/)** - UI component library
- **[Ink 6](https://github.com/vadimdemedes/ink)** - React for CLIs

### Build & Development

- **[esbuild](https://esbuild.github.io/)** - Fast ESM bundler
- **[Vitest](https://vitest.dev/)** - Unit, React, type, and E2E testing
- **[Biome](https://biomejs.dev/)** - Linter and formatter

---

## Project Structure

```
mesh-sync/
├── src/
│   ├── app/                       # Application entry points
│   │   ├── cli.ts                 # CLI entry point (Commander)
│   │   └── tui.tsx                # TUI entry point (mesh-sync-tui)
│   ├── engine/                    # Core sync pipeline
│   │   ├── resolver.ts            # Source type classification (local/url/git)
│   │   ├── fetcher.ts             # Content fetching (fs read, HTTP, git raw API)
│   │   ├── executor.ts            # Worker thread transformer execution
│   │   ├── worker.ts              # Worker thread entry point
│   │   ├── pipeline.ts            # Orchestrator: fetch -> transform chain -> write
│   │   └── writer.ts              # Atomic writes and error markers
│   ├── transformers/              # Built-in transformers
│   │   ├── passthrough.ts         # Identity transform
│   │   ├── strip-comments.ts      # Remove @internal/@private blocks
│   │   ├── json-to-ts.ts          # JSON -> const TypeScript export
│   │   ├── openapi-to-types.ts    # OpenAPI schemas -> TypeScript types
│   │   └── registry.ts            # Built-in ID resolution
│   ├── types/                     # TypeScript type definitions
│   │   ├── Config/                # Config type
│   │   ├── Sync/                  # SyncEntry, Strategy types
│   │   ├── Transformer/           # Transformer function type, TransformContext
│   │   └── Status/                # SyncStatus, SyncResult types
│   ├── utils/                     # Utility functions
│   │   ├── Cache/                 # Hash/ETag caching
│   │   ├── Config/                # Config validation and loading
│   │   ├── Diff/                  # Unified diff generation
│   │   ├── Hash/                  # SHA256 content hashing
│   │   ├── Logger/                # Verbose logging
│   │   └── Time/                  # Interval string parsing (30s, 5m, 1h)
│   ├── tui/                       # TUI application (mesh-sync-tui)
│   │   ├── commands/              # Command system (browse + detail modes)
│   │   ├── components/            # React (Ink) components
│   │   │   └── SyncView/          # SplitPane: entry list + 3-column detail
│   │   ├── hooks/                 # React hooks
│   │   │   └── useUIState/        # UI state management
│   │   └── providers/             # React context providers
│   │       ├── ConfigProvider/    # Config loading and persistence
│   │       ├── SyncProvider/      # Sync engine integration
│   │       └── UIStateProvider/   # UI mode and selection state
│   └── watcher/                   # Watch/poll strategies
│       ├── local-watcher.ts       # Chokidar file system watcher
│       └── remote-poller.ts       # Timed interval poller
├── e2e/                           # End-to-end tests
├── examples/
│   └── basic/                     # Example project with mesh.json
├── docs/                          # Design documents and plans
├── dist/                          # Built output
├── biome.json                     # Biome configuration
├── tsconfig.json                  # TypeScript configuration
├── tsconfig.app.json              # App TypeScript configuration
├── tsconfig.vitest.json           # Test TypeScript configuration
├── vitest.unit.config.ts          # Unit test configuration
├── vitest.type.config.ts          # Type test configuration
├── vitest.e2e.config.ts           # E2E test configuration
├── esbuild.config.js              # esbuild bundler configuration
└── package.json
```

---

## Versioning

This project uses a custom versioning scheme: `MAJORYY.MINOR.PATCH`

| Part | Description | Example |
|------|-------------|---------|
| `MAJOR` | Major version number | `1` |
| `YY` | Year (last 2 digits) | `26` for 2026 |
| `MINOR` | Minor version | `0` |
| `PATCH` | Patch version | `0` |

**Example:** `126.0.0` = Major version 1, released in 2026, minor 0, patch 0

This format allows you to quickly identify both the major version and the year of release at a glance.

---

## Style Guide

Conventions for contributing to this project. All rules are enforced by code review; Biome handles formatting and lint.

### Exports

- **Named exports only** for utilities and types. Transformers use `export default` (this is the one exception — it's the transformer contract).
- **`import type`** — always use `import type` for type-only imports.
- **`.js` extensions** — all relative imports use explicit `.js` extensions (ESM requirement).

### File Structure

```
src/
├── app/              # CLI and TUI entry points
├── engine/           # Core sync engine (executor, pipeline, watcher)
├── transformers/     # One file per transformer (kebab-case)
├── tui/              # TUI application (commands, components, hooks, providers)
├── types/            # Shared type definitions
├── utils/            # Shared utility functions
└── watcher/          # File watcher implementation
```

### Transformers

Every transformer file follows the same contract:

```typescript
const transform = (source: string, context: TransformContext): string => {
    // ... transformation logic
};
export default transform;
```

- Helper functions go **above** the `const transform` declaration.
- JSON output uses tab indentation (`JSON.stringify(x, null, '\t')`), matching the Biome config.
- Each transformer has a co-located `.test.ts` file.

### Types

- Use `type` keyword for all type definitions — never `interface`.
- Shared types (used by multiple transformers) live in `src/types/`.
- No duplicate type definitions — import from the canonical source.

### Constants

- Shared engine constants live in `src/engine/engine.consts.ts`.
- No magic numbers — extract to named constants.
- Environment variables use the `MESH_SYNC_` prefix.

### Testing

- Every module has a co-located test file: `moduleName.test.ts`.
- Transformers: `transformerName.test.ts` next to the transformer file.

---

## License

ISC
