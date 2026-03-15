---
name: oracle-nerve
description: Self-healing nervous system for Oracle Daemon. Owns health monitoring, error feedback loops, escalation protocol, GPT-Claude communication bridge, and auto-fix dispatch.
---

# Oracle Nerve — The Nervous System

> "Anyone can do wrong, but we keep better together." — The feedback loop corrects, the system learns.

Oracle Nerve is the self-healing layer of the Oracle Daemon. Like a negative feedback loop in an electronic circuit, it continuously senses, compares, corrects, and verifies.

## Architecture: Negative Feedback Loop

```
Setpoint (all systems healthy)
       │
       ▼
  ┌─ Heartbeat (sensor) ──── measures system state every 5 min
  │         │
  │         ▼
  │    PULSE Event (error signal) ── deviation from healthy setpoint
  │         │
  │         ▼
  │    Dispatch Engine (comparator) ── matches rules + known-fixes
  │         │
  │         ├── Auto-fix (actuator) ── corrects deviation
  │         ├── Claude /do (actuator) ── diagnoses complex issues
  │         └── Fix Request (escalation) ── unknown errors → human/Claude inbox
  │         │
  │         ▼
  └──── Next heartbeat cycle ── verifies correction ──→ loop closes
```

## Escalation Ladder (oracle-daemon.ts)

| Level | Trigger | Action |
|-------|---------|--------|
| L1 | Process exits | Restart (3s delay) |
| L2 | 3 restarts/hour | Clear temp state + restart |
| L3 | 5 restarts/hour | Notify human via Telegram |
| L4 | No recovery in 15 min | Auto-spawn Claude to diagnose |
| L5 | Diagnosis complete/failed | Standby mode (retry every 5 min) |

Every level transition emits a PULSE event (`daemon:restart`, `daemon:escalation`, `nerve:diagnosis`, `daemon:recovered`).

## Communication Bridge (GPT ↔ Claude)

**GPT → Claude**: Every Telegram conversation is logged to `ψ/inbox/telegram-queue.jsonl`. Claude reads unread items on session startup via `session-context.md`.

**Claude → GPT**: Session context, git commits, events, retrospectives, handoffs all feed into GPT's live context. `/do` results update session-context.md immediately.

**Error → Fix**: Errors create fix-requests in `ψ/inbox/fix-requests.jsonl`. Dispatch engine includes open requests in session-context.md. Claude sees them on next session.

## Known Fixes Registry

File: `.agents/skills/oracle-nerve/known-fixes.json`

A curated lookup table of error patterns → fixes. Not ML — just a growing database that Claude and the human maintain together.

- `auto: true` — dispatch-engine runs the shell command directly
- `auto: false` + `do_command` — dispatch-engine spawns Claude with the prompt
- No match — creates a fix-request for manual resolution

### Adding a New Fix

After resolving an error manually, add it to known-fixes.json:
```json
{
  "id": "descriptive-id",
  "match": { "agent": "agent-name", "error_contains": "error substring" },
  "fix": "shell command to fix",
  "description": "What this fix does",
  "auto": true
}
```

The dispatch-engine hot-reloads known-fixes.json every 5 minutes.

## PULSE Events Emitted

| Event | Source | Meaning |
|-------|--------|---------|
| `heartbeat:fail` | heartbeat | Health check transition: healthy → unhealthy |
| `heartbeat:recover` | heartbeat | Health check transition: unhealthy → healthy |
| `heartbeat:ok` | heartbeat | Keepalive (every 30 min when all healthy) |
| `daemon:restart` | oracle-daemon | L1: simple restart |
| `daemon:escalation` | oracle-daemon | L2-L5: escalation level change |
| `daemon:exit` | oracle-daemon | Process exited (any level) |
| `nerve:diagnosis` | oracle-daemon | L4: Claude diagnosis result |
| `nerve:fix-result` | dispatch-engine | Auto-fix execution result |
| `daemon:recovered` | oracle-daemon | Process recovered from escalation |

## Key Files

| File | Purpose |
|------|---------|
| `scripts/lib/pulse.ts` | Shared PULSE module (events, notifications, logging) |
| `scripts/heartbeat.ts` | Sensor — health checks with state transition events |
| `scripts/oracle-daemon.ts` | Supervisor — escalation ladder |
| `scripts/dispatch-engine.ts` | Comparator + actuator — rule matching + auto-fix |
| `scripts/oracle-bot.ts` | GPT bridge — Telegram conversations + /do |
| `.agents/skills/oracle-nerve/known-fixes.json` | Fix registry |
| `ψ/pulse/dispatch-rules.json` | Rule definitions |
| `ψ/pulse/events.jsonl` | Audit trail — every event logged |
| `ψ/inbox/fix-requests.jsonl` | Open fix requests for Claude |
| `ψ/inbox/telegram-queue.jsonl` | GPT → Claude inbox |

## Philosophy

1. **Errors are expected** — the system doesn't panic, it corrects
2. **Every action is logged** — events.jsonl is the audit trail
3. **Known fixes grow over time** — each manual fix becomes an auto-fix
4. **Escalation is gradual** — restart → reset → notify → diagnose → standby
5. **Nothing dies silently** — every state transition is visible
6. **Two brains, one memory** — GPT and Claude share context through files
