#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
 echo "Node.js 22+ et npm sont nécessaires."
 exit 1
fi
npm run setup
npm run studio
