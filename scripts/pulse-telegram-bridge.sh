#!/usr/bin/env bash
# Sends event notifications to Telegram
# Usage: bash pulse-telegram-bridge.sh <event_type> <message>

source "$(dirname "$0")/../.env" 2>/dev/null || true
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-917848477}"

[ -z "$BOT_TOKEN" ] && echo "No TELEGRAM_BOT_TOKEN" && exit 1

EVENT="${1:-update}"
MESSAGE="${2:-No message}"

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  -d "text=${MESSAGE}" > /dev/null

echo "✓ Telegram notified: $EVENT"
