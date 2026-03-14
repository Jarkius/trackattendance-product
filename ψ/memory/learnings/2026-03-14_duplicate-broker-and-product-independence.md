# Duplicate System Services and Product Independence

**Date**: 2026-03-14
**Context**: TrackAttendance product launch session — MQTT debugging + workspace restructure
**Confidence**: High

## Key Learning

Two distinct but connected learnings from this session:

**Technical**: Duplicate system services (like mosquitto) can silently intercept traffic without errors. When a bare mosquitto (no config) starts alongside the configured one, both bind to port 1883 but only the configured one has WebSocket on 9001. CLI tools hit the wrong broker, extension connects to the right one — no errors anywhere, just silence. Always run `ps aux | grep [service]` before debugging connectivity issues.

**Strategic**: The mid-market gap in attendance tracking ($20-100/month) is real. Global giants are overbuilt ($7,800+/year), free tools lack multi-site sync. Per-station pricing ($19/mo) beats per-user pricing ($4-12/user) for large workforces because cost stays flat regardless of headcount. The biggest competitor in SEA isn't SaaS — it's paper and punch cards.

## The Pattern

```bash
# Before debugging any service connectivity:
ps aux | grep mosquitto | grep -v grep
# If multiple processes → kill the one without -c flag

# MQTT timestamp rule:
# Extension uses Date.now() (milliseconds, 13 digits)
# NEVER use date +%s (seconds, 10 digits) — extension rejects as stale
```

## Why This Matters

The MQTT fix unblocked the entire /deep-research workflow which directly fed into the commercial plan. The commercial insight — that offline-first + per-station + simple setup has no mid-market competitor — validates building this as an independent product rather than internal tooling for someone else's company.

## Tags

`mqtt`, `mosquitto`, `debugging`, `duplicate-services`, `pricing-strategy`, `per-station`, `sea-market`, `product-independence`, `trackattendance`
