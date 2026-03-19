---
title: Overview
teleport:
  file: src/app/cli.ts
  line: 16
  highlight: buildProgram
---

# mesh-sync Overview

mesh-sync keeps files in sync across repositories by fetching sources, running them through a chain of transformers, and writing the output to target paths. Configuration lives in `mesh.json`, which defines sync entries with source, target, transformer, and strategy fields.

## How it works

The CLI entry point at `buildProgram` (line 16) registers three commands: `sync` runs the pipeline, `init` scaffolds a starter config, and `list` shows all entries. Each command resolves the config path, loads the mesh.json, and delegates to the engine.

## What to do

Press `o` to teleport to the CLI entry point and see how commands are wired up.
