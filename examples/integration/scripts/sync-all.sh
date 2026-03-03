#!/usr/bin/env bash
set -euo pipefail
echo "Syncing all entries..."
MESH_SYNC_PICK="name,version,features" \
MESH_SYNC_SECTION="API Guide" \
MESH_SYNC_BASE_URL="https://github.com/example/repo/blob/main" \
MESH_SYNC_WRAP_PREFIX="// === VENDOR START ===\n" \
MESH_SYNC_WRAP_SUFFIX="\n// === VENDOR END ===" \
mesh-sync sync
echo "Done!"
