#!/usr/bin/env bash
set -euo pipefail
echo "Dry-run preview:"
MESH_SYNC_PICK="name,version,features" \
MESH_SYNC_SECTION="API Guide" \
MESH_SYNC_BASE_URL="https://github.com/example/repo/blob/main" \
mesh-sync sync --dry-run
