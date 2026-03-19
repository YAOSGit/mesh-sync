---
title: Command Scoping
teleport:
  file: src/tui/commands/index.ts
  line: 13
  highlight: PROJECT_COMMANDS
---

# Browse vs Detail Commands

The `PROJECT_COMMANDS` array at line 13 defines all keyboard shortcuts using the toolkit's `createCommandsProvider` pattern. Each command has an `isEnabled` guard that scopes it to a specific mode.

## Key functions

Browse mode commands (`inBrowse` guard) include arrow navigation, Enter to open detail, `s` to sync one entry, `S` to sync all, `w` to toggle watch mode, `n` to add a new entry, and `d` to delete. Detail mode commands (`inDetail` guard) add column navigation with arrows, `j`/`k` for chain reorder, `a` to add a transformer, `d` to remove one, and `t` to change strategy.

## How it works

The `notInputting` helper prevents command execution when a text field or picker overlay is active, avoiding conflicts between navigation keys and text input. Press `o` to teleport to the command definitions.
