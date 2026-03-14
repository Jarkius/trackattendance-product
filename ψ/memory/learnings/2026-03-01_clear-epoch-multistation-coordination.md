# Clear Epoch: Safe Multi-Station Data Coordination

**Date**: 2026-03-01
**Context**: trackattendance multi-station clear feature
**Confidence**: High

## Key Learning

When coordinating state changes across multiple independent stations (or nodes), use a **version timestamp comparison** rather than a boolean flag or command queue. The `clear_epoch` pattern works by storing a timestamp in a shared location (cloud database) and having each station compare its local copy against the cloud copy on every health check.

The critical safety insight is handling **first-time stations** — a new station connecting to a cloud that already has a `clear_epoch` from a previous clear must NOT interpret that as "I need to clear my data." Instead, it should initialize its local epoch to the current cloud value without performing any destructive action. Only a CHANGE in the cloud epoch (compared to a station's previously-stored local epoch) triggers a clear.

This pattern is inherently safe because: (1) the epoch is inert once all stations match, (2) it only triggers on change, (3) first-time stations initialize without clearing, (4) the comparison is idempotent — running it multiple times with the same values produces no action, and (5) the clear + epoch update + heartbeat happen atomically within a single health check cycle, so stations transition directly from invisible to ready, never lingering in "pending" state.

## The Pattern

```python
# On every health check cycle (~60s):
cloud_epoch = get_from_cloud()
local_epoch = db.get_meta("last_clear_epoch")

if local_epoch is None and cloud_epoch:
    # First-time: initialize, do NOT clear
    db.set_meta("last_clear_epoch", cloud_epoch)
elif cloud_epoch and local_epoch and cloud_epoch != local_epoch:
    # Epoch changed: backup, clear, update
    export_backup()
    db.clear_all_scans()
    db.set_meta("last_clear_epoch", cloud_epoch)
# else: epochs match or no epoch exists — no action

# Always report status after comparison
send_heartbeat(station_name, local_epoch, scan_count)
```

Key design rules:
- Station name is configuration, not data — never cleared
- Auto-export backup before any destructive action
- Heartbeat table truncated on Clear All to prevent stale ghost entries
- Clear_epoch only set by triple-protected admin flow (API key + header + confirmation code)

## Why This Matters

This pattern applies to any distributed system where a coordinator needs to trigger an action on multiple independent nodes: cache invalidation, configuration reload, data migration, feature flag rollout. The version-comparison approach is simpler and safer than command queues or pub/sub because it's self-healing — if a station misses a health check, it catches up on the next one without any message replay.

## Tags

`distributed-systems`, `multi-station`, `coordination`, `clear-epoch`, `version-comparison`, `idempotent`, `safety`, `trackattendance`
