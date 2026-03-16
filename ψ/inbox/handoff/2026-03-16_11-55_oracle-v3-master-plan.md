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

## Revised Priority Order (after ultrathink review + Gemini + migration decision)

### Phase 0: HARDEN (1 session, ~1.5 hrs)
All independent, can parallel:
- [ ] 1. **409 fix** — call `deleteWebhook` before polling + increase daemon restart delay to 45s
- [ ] 2. **PID lock file** — `/tmp/oracle-daemon.pid`, check on startup
- [ ] 3. **L4 circuit breaker** — max 3 Claude diagnoses per day, then skip to L5
- [ ] 4. **tmux input sanitization** — temp file method (no shell interpolation)
- [ ] 9. **events.jsonl rotation** — rotate at 1000 lines (moved up — file already 500+ lines)

### Phase 1: MIGRATE TO THE-MATRIX (1 session, ~2 hrs)
- [ ] A1. **Move Oracle scripts to The-matrix** — `scripts/`, `ψ/pulse/`, `ψ/inbox/`, `.agents/skills/oracle-nerve/`
- [ ] A1b. **Extract lib/ modules** — `lib/telegram.ts`, `lib/tmux.ts` from oracle-bot.ts
- [ ] A1c. **Fix daily-report.ts imports** — currently hardcodes paths instead of importing from pulse.ts
- [ ] Symlink back to TrackAttendance for backwards compatibility

### Phase 2: DATA LAYER (1 session, ~3 hrs)
- [ ] 5. **SQLite hybrid migration** — `bun:sqlite`, dual-write (JSONL + SQLite), switch reads to SQLite
- [ ] 10. **Fix-request lifecycle** — auto-close when heartbeat recovers (easy with SQLite)

### Phase 3: REMOTE VISIBILITY (1-2 sessions, ~4 hrs)
- [ ] 6. **JSONL transcript monitor** + message queue — `lib/transcript.ts`, byte-offset watcher, batched Telegram sends
- [ ] 7. **Permission UI** — part of task 6, InlineKeyboard for Allow/Deny (depends on transcript parser detecting prompts)
- [ ] Keep tmux capture-pane as fallback — never remove

### Phase 4: INTELLIGENCE (1 session, ~2 hrs)
- [ ] 11. **Wire context-finder (Haiku)** — use for L4 pre-diagnosis triage (cheaper than full Claude)
- [ ] 12. **Wire executor agent** — safe bash for dispatch autofix

### Phase 5: POLISH (flexible order)
- [ ] 8. Session handoff — `/session` + `/resume`
- [ ] 14. Control center v2 — WebSocket live logs, event timeline
- [ ] 15. Screenshot in daily report
- [ ] 16. Email delivery

### REMOVED (from ultrathink review):
- ~~Task 13 (Distillation)~~ — premature at current data volume
- ~~Task 17 (Docker)~~ — wrong solution for single-dev Mac, use `--allowedTools` instead
- ~~A2, A3 (GPT/Gemini review)~~ — already done

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

### 🔴 Architecture Decision: EXTRACT Oracle Nerve as Independent Package

**REVISED** — Third-party architect review + The-matrix's own SOUL.md ("Beetle: Build swarms, not monoliths", "Cauldron: Separate concerns", "The Matrix Is Portable") both say: DON'T merge into The-matrix. Extract to `~/workspace/tools/oracle-nerve/` as its own portable package.

See full plan: `/Users/jarkius/.claude/plans/zesty-growing-mango.md`

~~### OLD: Move Oracle to The-matrix~~

**Decision**: Oracle infrastructure does NOT belong in `products/trackattendance/`. It's a general-purpose brain that should live in `/Users/jarkius/workspace/The-matrix/` and serve all projects.

**What moves to The-matrix**:
```
The-matrix/
├── scripts/
│   ├── lib/pulse.ts          # Shared PULSE module
│   ├── lib/telegram.ts       # Telegram helpers
│   ├── lib/tmux.ts           # tmux integration
│   ├── lib/db.ts             # SQLite data layer
│   ├── oracle-daemon.ts      # Supervisor
│   ├── oracle-bot.ts         # GPT bridge
│   ├── dispatch-engine.ts    # Event processor
│   ├── heartbeat.ts          # Health sensor
│   ├── control-center.ts     # Web dashboard
│   └── daily-report.ts       # Morning newspaper
├── ψ/pulse/                  # Events, heartbeat, dispatch rules
├── ψ/inbox/                  # Telegram queue, fix requests
├── .agents/skills/oracle-nerve/  # Self-healing skill
└── .agent/agents/            # context-finder, executor, oracle-nerve
```

**What stays in TrackAttendance**:
```
products/trackattendance/
├── trackattendance-api/      # API code
├── trackattendance-frontend/ # Desktop app
├── CLAUDE.md                 # Project-specific instructions
└── (symlink to The-matrix ψ/ for shared brain access)
```

**Why**: "Form and Formless" — the Oracle is one consciousness serving many projects. TrackAttendance is one product, The-matrix is the brain. Same source, different forms.

**Migration**: Do this as part of Phase 1 (folder restructure). Move scripts/ and ψ/ to The-matrix, symlink back for backwards compatibility.

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

## Cross-Agent Handoff

| Date | Target | File |
|------|--------|------|
| 2026-03-16 | The-matrix | `~/workspace/The-matrix/psi/swarm/handoffs/2026-03-16_oracle-nerve-to-matrix_evolution-patterns.md` |

**Purpose**: Knowledge transfer of all battle-tested patterns, code snippets, tool evaluations, Gemini architecture review, and third-party architect warnings — for The-matrix to evolve independently. NOT a code migration.

**How The-matrix receives it**: BOOT.md Step 8 scans `psi/swarm/handoffs/` for new handoffs. The-matrix reads, evaluates, and makes its own decisions.

## Session Retrospectives

| Date | File | Focus |
|------|------|-------|
| 2026-03-16 00:31 | `ψ/memory/retrospectives/2026-03/16/00.31_oracle-nerve-telegram-bridge-ccbot.md` | Oracle Nerve + CCBot + bridge |
| 2026-03-16 11:42 | `ψ/memory/retrospectives/2026-03/16/11.42_oracle-evolution-morning-report-ccbot.md` | Daily report + control center + eval |
