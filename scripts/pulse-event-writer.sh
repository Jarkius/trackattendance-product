#!/usr/bin/env bash
set -euo pipefail
# Usage: bash pulse-event-writer.sh <event_type> <agent> [data_json]
# Example: bash pulse-event-writer.sh "deploy:success" "Jarvis" '{"url":"https://trackattendance.jarkius.com"}'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
EVENTS_FILE="$PROJECT_ROOT/ψ/pulse/events.jsonl"
mkdir -p "$(dirname "$EVENTS_FILE")"

EVENT_TYPE="${1:-unknown}"
AGENT="${2:-System}"
DATA="${3:-{}}"
TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

echo "{\"timestamp\":\"$TIMESTAMP\",\"event\":\"$EVENT_TYPE\",\"agent\":\"$AGENT\",\"data\":$DATA}" >> "$EVENTS_FILE"
echo "✓ Event: $EVENT_TYPE ($AGENT)"
