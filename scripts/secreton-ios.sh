#!/bin/bash
set -e

WORKSPACE_ROOT="${SRCROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
ENVFILE="${ENVFILE:-.env}"
CLI_BIN="$WORKSPACE_ROOT/node_modules/.bin/rn-secreton-cli"

if [ ! -f "$WORKSPACE_ROOT/$ENVFILE" ]; then
  echo "❌ ENV file not found: $WORKSPACE_ROOT/$ENVFILE"
  exit 1
fi

if [ ! -x "$CLI_BIN" ]; then
  echo "❌ rn-secreton-cli not found at $CLI_BIN"
  exit 1
fi

echo "🔐 rn-secreton generating env (iOS)..."
: "${ENV_SECRET_KEY:?❌ ENV_SECRET_KEY not set}"

"$CLI_BIN" "$WORKSPACE_ROOT/$ENVFILE"

while IFS='=' read -r key value; do
  [ -z "$key" ] && continue
  [[ "$key" =~ ^# ]] && continue
  export "$key=$value"
done < "$WORKSPACE_ROOT/$ENVFILE"
