#!/usr/bin/env bash
# Mint a per-session GitHub App installation token for the loop routines and
# expose it as GH_TOKEN, so a role's issue/PR comments and reviews carry its own
# [bot] identity. No-op outside cloud or when App creds are absent, so it is
# harmless in interactive/local sessions. Commits/pushes are unaffected (they stay
# on the default @axross identity).
set -euo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0                  # cloud sessions only
[ -n "${APP_ID:-}" ] && [ -n "${APP_PRIVATE_KEY:-}" ] || exit 0   # a loop routine only

# Derive owner/repo from the origin remote's last two path segments. Works for the
# cloud git proxy URL (http://local_proxy@host/git/OWNER/REPO) and for github.com.
REPO="$(git remote get-url origin | sed -E 's#\.git$##' | awk -F/ '{print $(NF-1)"/"$NF}')"

# Build a short-lived App JWT (RS256, <=10 min), then mint an installation token.
key_file="$(mktemp)"; trap 'rm -f "$key_file"' EXIT
printf '%s\n' "$APP_PRIVATE_KEY" > "$key_file"
b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }
now="$(date +%s)"
header="$(printf '%s' '{"alg":"RS256","typ":"JWT"}' | b64url)"
claims="$(printf '{"iat":%d,"exp":%d,"iss":"%s"}' "$((now - 60))" "$((now + 540))" "$APP_ID" | b64url)"
sig="$(printf '%s' "${header}.${claims}" | openssl dgst -sha256 -sign "$key_file" -binary | b64url)"
jwt="${header}.${claims}.${sig}"
gh_api() { curl --fail-with-body -sS -H "Authorization: Bearer ${jwt}" \
  -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" "$@"; }
install_id="$(gh_api "https://api.github.com/repos/${REPO}/installation" | jq -er '.id')"
token="$(gh_api -X POST "https://api.github.com/app/installations/${install_id}/access_tokens" | jq -er '.token')"

# Persist GH_TOKEN for the session's subsequent Bash commands (gh reads it).
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  printf 'GH_TOKEN=%s\n' "$token" >> "$CLAUDE_ENV_FILE"
fi
