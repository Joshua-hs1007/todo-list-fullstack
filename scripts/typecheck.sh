#!/usr/bin/env bash
set -euo pipefail

echo "Running TypeScript type checks..."

if command -v pnpm >/dev/null 2>&1; then
  pnpm typecheck
else
  echo "pnpm is required but was not found in PATH." >&2
  exit 1
fi

echo "Type checks passed."
