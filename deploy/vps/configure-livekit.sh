#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="/etc/coreskils/api.env"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root: sudo bash deploy/vps/configure-livekit.sh" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "$ENV_FILE does not exist. Complete the base VPS setup first." >&2
  exit 1
fi

read -r -p "LiveKit WebSocket URL (wss://...): " livekit_url
read -r -p "LiveKit API key: " livekit_key
read -r -s -p "LiveKit API secret (hidden): " livekit_secret
echo

if [[ ! "$livekit_url" =~ ^wss:// ]]; then
  echo "LIVEKIT_URL must start with wss://" >&2
  exit 1
fi

if [[ -z "$livekit_key" || -z "$livekit_secret" ]]; then
  echo "LiveKit API key and secret are required." >&2
  exit 1
fi

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

grep -vE '^(LIVEKIT_URL|LIVEKIT_API_KEY|LIVEKIT_API_SECRET)=' "$ENV_FILE" > "$tmp_file"
{
  printf 'LIVEKIT_URL=%s\n' "$livekit_url"
  printf 'LIVEKIT_API_KEY=%s\n' "$livekit_key"
  printf 'LIVEKIT_API_SECRET=%s\n' "$livekit_secret"
} >> "$tmp_file"

install -o root -g root -m 600 "$tmp_file" "$ENV_FILE"
systemctl restart coreskils-api

if ! systemctl is-active --quiet coreskils-api; then
  echo "CoreSkils API did not restart successfully." >&2
  journalctl -u coreskils-api -n 50 --no-pager >&2
  exit 1
fi

curl --fail --silent --show-error http://127.0.0.1:4000/api/healthz
echo
echo "LiveKit is configured and the CoreSkils API is running."