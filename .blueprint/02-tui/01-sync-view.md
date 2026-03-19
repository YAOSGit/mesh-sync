---
title: SyncView Layout
teleport:
  file: src/tui/components/SyncView/index.tsx
  line: 108
  highlight: SyncView
---

# SyncView Component

The `SyncView` component at line 108 is the main TUI screen. It uses a `SplitPane` with a 35/65 vertical split: the top pane lists all sync entries with status icons, and the bottom pane shows a three-column detail view (Source, Transformers, Target).

## How it works

The component manages a `Mode` union type that tracks whether you are browsing entries, editing a detail field, picking a source type, selecting a transformer from the scrollable picker, or running the add-entry wizard. Arrow keys navigate between the three columns in detail mode, and `j`/`k` reorder the transformer chain.

## What to expect

The entry list shows real-time status from the `SyncProvider` context, including synced/error indicators and last-sync timestamps. Press `o` to teleport to the component.
