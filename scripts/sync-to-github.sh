#!/usr/bin/env bash
# sync-to-github.sh
# Pushes a clean snapshot of the current source to:
# https://github.com/12-Yards/Orbit8-Tenants-Platform
#
# Usage: bash scripts/sync-to-github.sh
# Requires: GITHUB_PERSONAL_ACCESS_TOKEN environment variable

set -e

REPO_URL="https://github.com/12-Yards/Orbit8-Tenants-Platform.git"
SYNC_DIR="/tmp/github-sync-orbit8"
WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "ERROR: GITHUB_PERSONAL_ACCESS_TOKEN is not set."
  exit 1
fi

echo "==> Preparing clean snapshot..."
rm -rf "$SYNC_DIR"
mkdir -p "$SYNC_DIR"

# Copy source excluding build artefacts and git history
tar \
  --exclude='./.git' \
  --exclude='./.next' \
  --exclude='./node_modules' \
  --exclude='./*.tar.gz' \
  --exclude='./.tmp_*' \
  -cf - -C "$WORKSPACE" . | tar -xf - -C "$SYNC_DIR"

echo "==> Files copied: $(find "$SYNC_DIR" -type f | wc -l)"

echo "==> Initialising fresh git repo..."
cd "$SYNC_DIR"
git init -q
git config user.email "sync@replit"
git config user.name "Replit Sync"

echo "==> Staging all files..."
git add -A

TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M UTC")
git commit -q -m "Sync from Replit — $TIMESTAMP"

echo "==> Pushing to GitHub..."
git remote add origin "https://x-access-token:${GITHUB_PERSONAL_ACCESS_TOKEN}@${REPO_URL#https://}"
git branch -M main
git push --force -u origin main

echo ""
echo "Done! Code is live at https://github.com/12-Yards/Orbit8-Tenants-Platform"
