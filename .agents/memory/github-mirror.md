---
name: GitHub mirror of the workspace
description: How the workspace repo is mirrored to the user's GitHub repo, why the first push failed, and rules for the sync workflow.
---

# GitHub mirror

**Rule:** The user's GitHub repo (`origin`, branch `main`) is a mirror of the Replit workspace (`master`), pushed by the `GitHub Auto Sync` workflow. Never write the token into `.git/config` or a remote URL; the script feeds the `GITHUB_TOKEN` secret to git through `GIT_ASKPASS`.

**Why:** The user pasted a GitHub token in chat once (told them to revoke it); all credentials must flow through Replit Secrets only.

## Shallow-clone trap (2026-09-18)
The workspace repo was a **shallow** clone (boundary commit came from the template repo `guillermoscript/lms-front`). GitHub rejects pushes from shallow repos with `remote unpack failed: index-pack failed / did not receive expected object`. Fix was `git fetch --unshallow https://github.com/guillermoscript/lms-front.git master` (adds ~40 MB), after which the push succeeded. If `.git/shallow` ever reappears (e.g. after a re-import), repeat this before pushing.

## How to apply
- Push the branch **by name** (`master:refs/heads/main`), not `HEAD:...`, so `refs/remotes/origin/main` is updated and `--force-with-lease` works on later pushes.
- The lease means checkpoint rollbacks are mirrored, but commits made directly on GitHub block the sync until pulled in Replit; the workflow log says so.
- Files ≥95 MB are excluded locally (`.git/info/exclude`) instead of being committed, because one oversized blob would wedge every future push.
- The user's repo was public at setup time; they were advised to make it private.
