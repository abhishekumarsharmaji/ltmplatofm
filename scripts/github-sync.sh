#!/usr/bin/env bash
# Mirrors this workspace to GitHub while Replit is running.
#
# Every INTERVAL seconds it:
#   1. commits any pending workspace changes (agent checkpoints already commit on their own),
#   2. pushes the current branch to origin/<GITHUB_SYNC_BRANCH> when GitHub is behind.
#
# The push uses --force-with-lease so a checkpoint rollback in Replit is mirrored too, but a commit
# made directly on GitHub (not by this script) is never overwritten - the push is refused and logged instead.
#
# Required: GITHUB_TOKEN secret (fine-grained token, Contents: read/write on the target repo).
# The token is handed to git through GIT_ASKPASS and is never written into .git/config or the URL.
set -u
cd "$(dirname "$0")/.."

REMOTE="${GITHUB_SYNC_REMOTE:-origin}"
BRANCH="${GITHUB_SYNC_BRANCH:-main}"
INTERVAL="${GITHUB_SYNC_INTERVAL_SECONDS:-120}"
MAX_FILE_MB=95 # GitHub rejects blobs over 100 MB; keep them out of history instead of wedging every push.

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "GITHUB_TOKEN secret is not set - GitHub sync is disabled." >&2
  exit 1
fi

export GIT_TERMINAL_PROMPT=0
ASKPASS="$(mktemp)"
chmod 700 "$ASKPASS"
cat >"$ASKPASS" <<'EOF'
#!/bin/sh
case "$1" in
  *sername*) echo "x-access-token" ;;
  *) printf '%s\n' "$GITHUB_TOKEN" ;;
esac
EOF
export GIT_ASKPASS="$ASKPASS"
trap 'rm -f "$ASKPASS"' EXIT

log() { printf '%s %s\n' "$(date -u +%H:%M:%S)" "$*"; }

exclude_oversized_files() {
  # Ignore (locally, via .git/info/exclude) any untracked file GitHub would reject.
  git ls-files --others --exclude-standard -z |
    while IFS= read -r -d '' file; do
      size_mb=$(( $(stat -c %s "$file") / 1048576 ))
      if [ "$size_mb" -ge "$MAX_FILE_MB" ]; then
        echo "/$file" >>.git/info/exclude
        log "skipping $file (${size_mb} MB is over GitHub's file size limit)"
      fi
    done
}

commit_pending_changes() {
  exclude_oversized_files
  if [ -z "$(git status --porcelain)" ]; then
    return 0
  fi
  git add -A
  git -c user.name="Replit Auto Sync" -c user.email="replit-auto-sync@users.noreply.github.com" \
    commit -q -m "Auto-sync from Replit ($(date -u +%Y-%m-%d\ %H:%M) UTC)" && log "committed pending changes"
}

push_if_behind() {
  local head remote_head
  head="$(git rev-parse HEAD)"
  remote_head="$(git rev-parse -q --verify "refs/remotes/$REMOTE/$BRANCH" 2>/dev/null || true)"
  if [ "$head" = "$remote_head" ]; then
    return 0
  fi
  if output="$(git push -q --force-with-lease "$REMOTE" "HEAD:refs/heads/$BRANCH" 2>&1)"; then
    log "pushed ${head:0:7} to $REMOTE/$BRANCH"
  else
    log "push failed: $output"
    if printf '%s' "$output" | grep -qi "stale info\|rejected"; then
      log "GitHub has commits that Replit does not. Pull them in Replit (Git pane) before the sync can continue."
    fi
  fi
}

log "GitHub sync started -> $REMOTE/$BRANCH every ${INTERVAL}s"
while true; do
  commit_pending_changes
  push_if_behind
  sleep "$INTERVAL"
done
