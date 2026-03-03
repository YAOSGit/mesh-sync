# Integration Example

Full real-world mesh-sync setup demonstrating multiple source types, transformer chains, environment variable configuration, and automation scripts.

## What This Shows

- **5 sync entries** covering different source types (JSON, OpenAPI, `.env`, Markdown, TypeScript) and transformer chains
- **Environment variable configuration** for transformers via `MESH_SYNC_*` env vars
- **Shell scripts** for different sync workflows (full sync, dry-run preview, single entry)

## Sync Entries

| ID            | Source              | Transformers                                                  | Target                      |
|---------------|---------------------|---------------------------------------------------------------|-----------------------------|
| shared-config | `config.json`       | `json-pick` -> `json-to-ts`                                   | `generated/config.ts`       |
| api-types     | `api-schema.json`   | `openapi-to-types` -> `add-banner`                            | `generated/api-types.ts`    |
| env-vars      | `env-template.env`  | `env-filter`                                                  | `generated/public.env`      |
| docs-extract  | `full-docs.md`      | `markdown-extract-section` -> `markdown-rewrite-links`        | `generated/api-guide.md`    |
| vendor-bundle | `vendor-utils.ts`   | `strip-comments` -> `strip-exports` -> `add-project-header` -> `wrap` | `generated/vendor-bundle.ts` |

## How to Run

### Sync all entries

```bash
./scripts/sync-all.sh
```

This sets all required `MESH_SYNC_*` environment variables and runs `mesh-sync sync`.

### Dry-run preview

```bash
./scripts/sync-dry-run.sh
```

Shows what would be generated without writing any files.

### Sync a single entry

```bash
./scripts/sync-single.sh <entry-id>
```

For example:

```bash
./scripts/sync-single.sh api-types
```
