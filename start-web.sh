#!/usr/bin/env bash

set -euo pipefail

# Resolve repo root (directory containing this script)
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

# Preconditions: Supabase CLI and pnpm must be available
if ! command -v supabase >/dev/null 2>&1; then
  echo "Error: Supabase CLI is not installed or not on PATH. See https://supabase.com/docs/guides/local-development#install-the-cli" >&2
  exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm is not installed or not on PATH. Install via: npm i -g pnpm" >&2
  exit 1
fi

# 1) Start local Supabase stack
echo "Starting local Supabase..."
SUPABASE_WORKDIR="$REPO_ROOT" supabase start >/dev/null

# 2) Gather local keys from Supabase status (without exporting globally)
STATUS_ENV="$(SUPABASE_WORKDIR="$REPO_ROOT" supabase status -o env)"
ANON_KEY="$(printf "%s\n" "$STATUS_ENV" | grep '^ANON_KEY=' | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//')"
SERVICE_ROLE_KEY="$(printf "%s\n" "$STATUS_ENV" | grep '^SERVICE_ROLE_KEY=' | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//')"

if [[ -z "${ANON_KEY:-}" || -z "${SERVICE_ROLE_KEY:-}" ]]; then
  echo "Error: Could not retrieve local Supabase keys from 'supabase status'." >&2
  exit 1
fi

# 3) Conditionally export public env vars for the web app (do not overwrite if already set)
: "${NEXT_PUBLIC_SUPABASE_URL:=}"
: "${NEXT_PUBLIC_SUPABASE_ANON_KEY:=}"

if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" ]]; then
  export NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
  echo "Exported NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
else
  echo "NEXT_PUBLIC_SUPABASE_URL already set; leaving as-is"
fi

if [[ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]]; then
  export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
  echo "Exported NEXT_PUBLIC_SUPABASE_ANON_KEY from local Supabase"
else
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY already set; leaving as-is"
fi

# Show which NEXT_ envs will be used by the app
echo "Using NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
echo "Using NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY"

# 4) Ensure local migrations are applied
# Apply pending migrations to the local database without resetting data
echo "Applying pending migrations (if any)..."
SUPABASE_WORKDIR="$REPO_ROOT" supabase db push --local >/dev/null || true

# 5) Create dev user via supabase-js admin API using a small TS helper
# Ensure scripts deps are installed for the helper
if [[ ! -d "$REPO_ROOT/scripts/node_modules" ]]; then
  echo "Installing scripts dependencies..."
  pnpm --dir "$REPO_ROOT/scripts" install >/dev/null
fi

# Only seed dev user for local Supabase URL
if [[ "$NEXT_PUBLIC_SUPABASE_URL" == http://127.0.0.1:54321* || "$NEXT_PUBLIC_SUPABASE_URL" == http://localhost:54321* ]]; then
  echo "Creating dev user (dev@local.com) if missing..."
  export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
  export SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
  pnpm --dir "$REPO_ROOT/scripts" exec tsx create-dev-user.ts
else
  echo "Skipping dev user creation because NEXT_PUBLIC_SUPABASE_URL is not local."
fi

# 6) Start Next.js app
cd "$REPO_ROOT/web"
echo "Starting Next.js dev server in /web ..."
pnpm dev 