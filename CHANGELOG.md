# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [126.1.0] - 2026-03-19

### Added

- **TUI application** (`mesh-sync-tui`): interactive monitor and config editor
  - SplitPane layout: entry list (top) + 3-column detail view (bottom)
  - 3-column detail: SOURCE file tree → TRANSFORMERS chain → TARGET file tree
  - Transformer chain management: add (picker with type-to-filter), remove, reorder (j/k)
  - Transformer picker: 62 built-in + auto-discovered local transformers from `transformers/` directories
  - Source type picker: local / HTTP / git with prefilled prefixes
  - Strategy picker: manual / watch / poll (5s, 10s, 30s, 1m, 5m)
  - Manual sync trigger (`s` key) and sync-all (`S`)
  - Watch mode toggle (`w`)
  - File tree visualization for source/target paths with truncation for long names
  - Full command system with browse-mode and detail-mode scoping
  - Help menu with separate "Edit" section for detail commands
- `dist/tui.js` build output, `mesh-sync-tui` binary

### Changed

- All `interface` types in `src/types/` converted to `type` (8 conversions)
- `tsconfig.app.json` added `rootDir`, `jsx: react-jsx`, DOM lib for TUI
- Biome updated to 2.4.8
- Barrel `index.ts` files added for all directories
- Toolkit bumped to 0.0.26-3-19a
