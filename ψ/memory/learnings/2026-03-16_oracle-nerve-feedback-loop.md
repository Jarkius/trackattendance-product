# Negative Feedback Loops for Self-Healing Systems

**Date**: 2026-03-16
**Context**: Built Oracle Nerve v2.0 — self-healing daemon for TrackAttendance
**Confidence**: High

## Key Learning

Self-healing systems follow the same pattern as negative feedback loops in electronics. A sensor detects deviation from the healthy setpoint, an error signal is generated, a comparator matches it against known patterns, an actuator corrects the deviation, and the next sensor cycle verifies the correction. If the correction fails, gain increases (escalation).

The critical insight: **errors are expected, not failures**. The system doesn't panic on errors — it corrects them through the feedback loop. Each manual fix that works gets added to the known-fixes registry, making the system stronger over time. The loop only escalates to human intervention when automated correction fails.

A secondary learning: `Bun.write(path, data, { append: true })` silently ignores the append flag in Bun 1.3.5, causing silent data loss in JSONL files. Always use `node:fs/promises appendFile`. The nerve agent audit caught this bug — validating the audit approach.

## The Pattern

```
Sensor (heartbeat) → Error Signal (PULSE event) → Comparator (dispatch rules)
    → Actuator (known-fixes auto-fix) → Verify (next heartbeat) → Loop closes

Escalation: L1 restart → L2 reset → L3 notify → L4 diagnose → L5 standby
```

Each level increases the "gain" — more aggressive intervention for persistent errors.

## Why This Matters

- Systems that only monitor and alert are passive — they notify but don't act
- Self-healing systems actively correct deviations, reducing human intervention
- The known-fixes registry is the "memory" — the system learns from each incident
- The escalation ladder prevents infinite restart loops while ensuring recovery attempts
- The audit agent validates the system by questioning everything (skeptical by design)

## Tags

`self-healing`, `feedback-loop`, `oracle-nerve`, `daemon`, `escalation`, `bun-write-bug`, `pulse`, `dispatch`
