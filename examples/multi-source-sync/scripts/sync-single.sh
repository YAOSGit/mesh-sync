#!/usr/bin/env bash
set -euo pipefail
ENTRY="${1:?Usage: sync-single.sh <entry-id>}"
echo "Syncing entry: $ENTRY"
mesh-sync sync "$ENTRY"
