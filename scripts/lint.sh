#!/usr/bin/env bash
set -euo pipefail

echo "Running lint checks..."

if command -v pnpm >/dev/null 2>&1; then
  pnpm lint
else
  echo "pnpm is required but was not found in PATH." >&2
  exit 1
fi

echo "Lint checks passed."
