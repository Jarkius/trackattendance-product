# Oracle-Bot v3.0 Master Plan

**Created**: 2026-03-16 11:55 GMT+7
**Status**: Active — updated each session

## What's Live (v2.0)

| Component | File | Status |
|-----------|------|--------|
| Oracle Nerve self-healing (L1→L5) | `scripts/oracle-daemon.ts` | ✅ |
| GPT bridge + inbox | `scripts/oracle-bot.ts` | ✅ |
| PULSE events + dispatch + auto-fix | `scripts/dispatch-engine.ts` | ✅ |
| Heartbeat sensor | `scripts/heartbeat.ts` | ✅ |
| Daily morning newspaper (6am) | `scripts/daily-report.ts` | ✅ |
| Control center dashboard | `scripts/control-center.ts` | ✅ |
| CDP proxy daemon | oracle-daemon manages | ✅ |
| tmux send-keys | in oracle-bot.ts | ✅ |
| UserPromptSubmit hook | `~/.claude/hooks/check-telegram-inbox.sh` | ✅ |
| Known-fixes registry | `.agents/skills/oracle-nerve/known-fixes.json` | ✅ |
| Thai voice alert (L3) | oracle-daemon.ts | ✅ |

## Pending Work — Priority Order

### 🔴 Critical (do first)

| # | Task | Source | Effort | Notes |
|---|------|--------|--------|-------|
| 1 | **409 startup fix** — webhook trick before polling | Tonight's debugging | 15 min | Add to oracle-bot.ts startup |
| 2 | **PID lock file** — prevent duplicate oracle-daemon | Nerve audit | 15 min | Write PID to /tmp/oracle-daemon.pid |
| 3 | **L4 circuit breaker** — max 3 Claude diagnosis attempts | Gemini review | 15 min | Prevent infinite loop + billing runaway |
| 4 | **tmux input sanitization** — base64-encode payloads | Gemini review | 30 min | Security: prevent command injection |

### 🟠 High (v3.0 core)

| # | Task | Source | Effort | Notes |
|---|------|--------|--------|-------|
| 5 | **SQLite hybrid migration** — live data in SQLite, JSONL as audit | Gemini review + handoff | 2-3 hrs | Do BEFORE JSONL monitor (Gemini says) |
| 6 | **JSONL transcript monitor** — watch Claude output files, stream to Telegram | CCBot pattern | 2-3 hrs | Core missing piece. Ref: `ψ/learn/ccbot-patterns/KEY-PATTERNS.md` |
| 7 | **Permission UI** — grammY InlineKeyboard for Allow/Deny | CCBot pattern | 1 hr | Makes tmux injection useful from mobile |
| 8 | **Session handoff** — `/session` + `/resume` phone↔desktop | Clautel pattern | 2 hrs | Needs JSONL monitor first |

### 🟡 Nice (v3.0 enhancements)

| # | Task | Source | Effort | Notes |
|---|------|--------|--------|-------|
| 9 | **Events.jsonl rotation** — rotate at 1000 lines or daily | Nerve audit | 30 min | |
| 10 | **Fix-request lifecycle** — auto-close when heartbeat recovers | Nerve audit | 30 min | |
| 11 | **Wire context-finder agent** — Haiku for cheap event/fix search | opensourcenatbrain | 1 hr | Agent copied, not wired |
| 12 | **Wire executor agent** — safe bash for dispatch autofix | opensourcenatbrain | 1 hr | Agent copied, not wired |
| 13 | **Distillation pipeline** — weekly compress events → learnings | opensourcenatbrain | 2 hrs | |
| 14 | **Control center v2** — WebSocket logs, tmux viewer, event timeline | maw.js pattern | 3-4 hrs | |
| 15 | **Screenshot in daily report** — CDP capture of dashboards | OpenClaw pattern | 1 hr | |
| 16 | **Email delivery** — send report via IMAP/SMTP too | User request | 1 hr | |
| 17 | **Containerize Claude** — Docker sandbox for headless /do | Gemini review | Future | |

### 🏗️ Architecture (before v3.0 features)

| # | Task | Effort | Notes |
|---|------|--------|-------|
| A1 | **Modular folder restructure** — separate concerns into proper modules | 1-2 hrs | See proposed structure below |
| A2 | **GPT review of master plan** — send to GPT for second opinion | 30 min | Via oracle-bot or direct |
| A3 | **Gemini deep research on folder patterns** — how OpenClaw/maw.js structure code | 30 min | Learn from their structure |

### Proposed Folder Structure

```
scripts/
├── lib/
│   ├── pulse.ts          # Shared: events, notifications, logging (EXISTS)
│   ├── telegram.ts       # Telegram API helpers (extract from oracle-bot)
│   ├── tmux.ts           # tmux send-keys, capture, find pane (extract from oracle-bot)
│   └── db.ts             # SQLite/JSONL data layer (new — when SQLite migration)
├── daemons/
│   ├── oracle-bot.ts     # Telegram bot (move from scripts/)
│   ├── dispatch-engine.ts # Event processor (move from scripts/)
│   ├── heartbeat.ts      # Health sensor (move from scripts/)
│   └── control-center.ts # Web dashboard (move from scripts/)
├── oracle-daemon.ts      # Supervisor (stays at scripts/ root)
├── daily-report.ts       # Morning newspaper (stays at scripts/ root)
└── inbox-daemon.ts       # CLI utility (stays or delete)
```

Benefits:
- `lib/` = shared modules (import from anywhere)
- `daemons/` = supervised processes (oracle-daemon spawns these)
- Root = entry points and utilities
- Each daemon imports from `lib/` — no code duplication

## Decisions Made

| Decision | Source | Rationale |
|----------|--------|-----------|
| Pattern C (JSONL + tmux) | CCBot eval | Same session, structured data, desktop resume |
| One bot only | CCBot 409 failure | Can't run two polling bots from same machine |
| SQLite before JSONL monitor | Gemini review | Build on solid foundation, not flat files |
| Winner take all | Session philosophy | Cherry-pick best from every tool |
| Absorb CCBot, don't run it | CCBot debugging | 409 conflicts unresolvable on same machine |

## Reference Materials

| What | Where |
|------|-------|
| CCBot patterns cheat sheet | `ψ/learn/ccbot-patterns/KEY-PATTERNS.md` |
| CCBot full source | `ψ/learn/ccbot-patterns/*.py` |
| Gemini deep research (Telegram bridges) | `ψ/memory/learnings/2026-03-16_remote-claude-telegram-deep-research.md` |
| Gemini deep research (OpenClaw reports) | `ψ/memory/learnings/2026-03-16_openclaw-telegram-report-scheduling.md` |
| Gemini architecture review | `ψ/memory/learnings/2026-03-16_gemini-architecture-review.md` |
| Oracle lessons (anti-patterns) | `ψ/learn/oracle-lessons.md` |
| Distillation pipeline pattern | `ψ/learn/distillation-pattern.md` |
| Cloned repos for reference | `~/ghq/github.com/{six-ddc/ccmux, RichardAtCT/claude-code-telegram, ComposioHQ/secure-openclaw, Soul-Brews-Studio/maw-js}` |

## Session Retrospectives

| Date | File | Focus |
|------|------|-------|
| 2026-03-16 00:31 | `ψ/memory/retrospectives/2026-03/16/00.31_oracle-nerve-telegram-bridge-ccbot.md` | Oracle Nerve + CCBot + bridge |
| 2026-03-16 11:42 | `ψ/memory/retrospectives/2026-03/16/11.42_oracle-evolution-morning-report-ccbot.md` | Daily report + control center + eval |
