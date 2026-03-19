---
title: Try It
actions:
  - label: Initialize mesh.json
    command: node dist/cli.js init
---

# Scaffold Your First Config

Press `r` to run `mesh-sync init`. This creates a `mesh.json` with an example sync entry and a `transformers/` directory containing a passthrough transformer template.

## What to expect

The starter config defines one entry that copies `./src/source.ts` to `./src/generated/output.ts` using the example transformer. You can edit mesh.json to add your own entries, change source types (local paths, HTTP URLs, or GitHub references), and chain multiple transformers.

## What to do

After init completes, open `mesh.json` to see the structure, then try `mesh-sync sync` to run your first sync.
