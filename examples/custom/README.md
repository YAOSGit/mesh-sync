# Custom Example

Advanced mesh-sync configuration demonstrating custom transformers, chained pipelines, and multiple source types.

## What This Shows

- **3-step transformer chains**: strip comments, filter `@internal` types, then wrap in a namespace (`strip-comments` -> `strip-internal` -> `add-namespace`)
- **OpenAPI-to-fetch generation**: convert an OpenAPI 3.0 spec into typed fetch wrappers via `openapi-to-fetch`
- **Environment variable filtering**: filter `.env` files by prefix and convert to TypeScript with `env-filter` + `env-to-ts`

## Sync Entries

| ID            | Source                | Transformers                                          | Target                      |
|---------------|-----------------------|-------------------------------------------------------|-----------------------------|
| vendor-types  | `shared-types.ts`     | `strip-comments` -> `strip-internal` -> `add-namespace` | `generated/vendor-types.ts` |
| api-client    | `api-spec.json`       | `openapi-to-fetch`                                    | `generated/api-client.ts`   |
| env-config    | `env-template.env`    | `env-filter` -> `env-to-ts`                           | `generated/env-config.ts`   |

## How to Run

```bash
cd custom && mesh-sync sync
```

To sync a single entry:

```bash
mesh-sync sync vendor-types
```
