#!/usr/bin/env bash
# Backend secret / environment-variable guardrails.
# Fails the PR when server-only credentials leak into client code or into git.
set -uo pipefail

fail=0
report() { echo "::error file=$1::$2"; fail=1; }

SRC_GLOBS=(src public index.html)

echo "==> 1. Server-only env vars must never appear in client code"
SERVER_ONLY='SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEYS|SUPABASE_DB_URL|SUPABASE_JWKS|STRIPE_SECRET_KEY|RESEND_API_KEY|TMDB_API_KEY|LOVABLE_API_KEY'
while IFS=: read -r file line _; do
  [ -z "$file" ] && continue
  report "$file" "Server-only secret reference found in client code (line $line). Use a backend edge function instead."
done < <(grep -RIn -E "$SERVER_ONLY" "${SRC_GLOBS[@]}" 2>/dev/null || true)

echo "==> 2. Service-role clients must not be created in client code"
while IFS=: read -r file line _; do
  [ -z "$file" ] && continue
  report "$file" "service_role usage in client code (line $line)."
done < <(grep -RIn "service_role" "${SRC_GLOBS[@]}" 2>/dev/null || true)

echo "==> 3. Tracked .env files may only contain public VITE_ variables"
while read -r file; do
  [ -z "$file" ] && continue
  case "$file" in
    *.example|*.sample|*.template) continue ;;
  esac
  bad=$(grep -nE '^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*[[:space:]]*=' "$file" | grep -vE '^[0-9]+:[[:space:]]*VITE_' || true)
  if [ -n "$bad" ]; then
    report "$file" "Tracked env file contains non-public variables: $(echo "$bad" | cut -d= -f1 | tr '\n' ' ')"
  fi
done < <(git ls-files | grep -E '(^|/)\.env($|\.)' || true)

echo "==> 4. Edge functions must read secrets from the environment, not literals"
if [ -d supabase/functions ]; then
  while IFS=: read -r file line _; do
    [ -z "$file" ] && continue
    report "$file" "Hardcoded credential literal in edge function (line $line). Use Deno.env.get()."
  done < <(grep -RIn -E "(sk|rk)_(live|test)_[A-Za-z0-9]{16,}|sb_secret_[A-Za-z0-9_-]{16,}|\bre_[A-Za-z0-9_-]{16,}" supabase/functions 2>/dev/null || true)
fi

echo "==> 5. No JWT-shaped literals committed outside .env"
while IFS=: read -r file line _; do
  [ -z "$file" ] && continue
  case "$file" in
    *.env|*.env.*|*lock*|*/node_modules/*|*/dist/*) continue ;;
  esac
  report "$file" "JWT-shaped literal committed (line $line). Verify it is not a Supabase key."
done < <(git grep -In -E 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}' -- . ':!bun.lock' ':!bun.lockb' ':!package-lock.json' 2>/dev/null || true)

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "Backend secret guardrails FAILED. See the annotations above."
  exit 1
fi

echo "All backend secret guardrails passed."
