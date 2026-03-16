# Escalation Amplification: When Self-Healing Makes Things Worse

**Date**: 2026-03-16
**Context**: Oracle Nerve daemon ecosystem — control center crash loop
**Confidence**: High

## Key Learning

A self-healing escalation ladder (L1→L5) can amplify non-transient failures instead of fixing them. When the root cause is persistent (e.g., port already in use, 409 polling conflict), each restart attempt creates another failing process, which generates more error events, which triggers more notifications, which spawns more restarts. The negative feedback loop becomes a positive feedback loop.

The specific case: control-center.ts crashed with EADDRINUSE because an orphan process held port 3457. The daemon's L1 restart spawned a new process that also crashed on EADDRINUSE. L2 cleared the log and restarted — same result. L3 notified via Telegram and scheduled L4. Meanwhile, each failed restart generated PULSE events that the dispatch engine processed, sending more notifications. The system escalated from "one crashed daemon" to "19 open fix requests and a Telegram notification storm" in under an hour.

## The Pattern

**Detect non-transient failures and switch strategy instead of escalating:**

```typescript
// Before restart, check if the failure is transient
async function canRestartFix(daemon: DaemonConfig): boolean {
  // EADDRINUSE → kill port occupant, not restart
  if (daemon.lastError?.includes("EADDRINUSE")) {
    const port = extractPort(daemon);
    await killProcessOnPort(port);
    return true; // now restart will work
  }
  // 409 Conflict → wait for poll timeout, not restart immediately
  if (daemon.lastError?.includes("409")) {
    await sleep(35_000); // > Telegram's 30s poll timeout
    return true;
  }
  // Same exit code 3+ times → likely deterministic, skip to L4
  if (daemon.exitHistory.slice(-3).every(c => c === daemon.exitHistory.at(-1))) {
    return false; // don't restart, escalate differently
  }
  return true; // transient, restart is appropriate
}
```

**Add to known-fixes.json:**
```json
{
  "id": "eaddrinuse-port-conflict",
  "match": { "error_contains": "EADDRINUSE" },
  "fix": "lsof -i :${PORT} -P -t | xargs kill",
  "description": "Kill process occupying the port before restart",
  "auto": true
}
```

## Why This Matters

Self-healing systems must distinguish between transient failures (network blip, cold start) and persistent failures (resource conflict, syntax error, missing dependency). Blindly restarting persistent failures burns through the escalation budget, generates noise, and can mask the actual root cause under a flood of symptoms.

The fix is twofold:
1. **Root-cause-aware known fixes** — match error patterns to specific fix strategies, not just generic restarts
2. **Escalation circuit breaker** — if the same error repeats 3+ times with the same exit code, skip L1/L2 and go directly to L4 diagnosis or a targeted known-fix

## Tags

`self-healing`, `escalation`, `anti-pattern`, `daemon`, `oracle-nerve`, `feedback-loop`, `EADDRINUSE`, `409-conflict`
