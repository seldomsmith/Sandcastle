#!/bin/bash
# Start the Antigravity dev server
# Uses the locally installed Node.js 22 in .tools/

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE="$SCRIPT_DIR/.tools/bin/node"
NPM_CLI="$SCRIPT_DIR/.tools/lib/node_modules/npm/bin/npm-cli.js"

export PATH="$SCRIPT_DIR/.tools/bin:$PATH"

echo "Using Node: $($NODE --version)"
echo "Starting dev server..."

# Run: node /path/to/npm-cli.js run dev
exec "$NODE" "$NPM_CLI" run dev
