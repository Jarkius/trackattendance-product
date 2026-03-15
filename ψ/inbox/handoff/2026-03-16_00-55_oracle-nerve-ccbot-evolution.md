# Handoff: Oracle Nerve v2.0 + CCBot Absorption

**Date**: 2026-03-16 00:55 GMT+7

## What We Did
- Built Oracle Nerve v2.0 (self-healing daemon, L1-L5 escalation, PULSE events)
- Created shared PULSE module (`scripts/lib/pulse.ts`) — fixed Bun.write append bug
- Built GPT ↔ Claude bridge (telegram-queue.jsonl inbox, session context, live context)
- Added UserPromptSubmit hook for Telegram inbox awareness
- Made /do non-blocking (fire-and-forget)
- Added tmux send-keys integration (maw.js pattern)
- Installed CCBot — learned patterns, hit 409 conflicts, decided to absorb instead
- Created oracle-nerve-agent for system auditing

## Lessons Learned (CRITICAL — Don't Repeat These)

### 1. Bun.write append is broken
`Bun.write(path, data, { append: true })` silently ignores the append flag. ALL JSONL appends must use `node:fs/promises appendFile` via `appendLine()` from `scripts/lib/pulse.ts`.

### 2. Two Telegram bots can't poll from the same machine
Even with different tokens, two bots doing long-polling from the same IP causes 409 Conflict on Telegram's servers. The TCP connections to `149.154.166.110` cross-contaminate. Solution: one bot only, or use webhooks.

### 3. Don't call `getUpdates` manually via curl
Every manual `curl getUpdates` call consumes updates that the bot should receive. This was the #1 reason CCBot appeared broken — we kept stealing its updates during debugging.

### 4. `drop_pending_updates: true` drops messages silently
Oracle-bot had this on every restart, throwing away all pending Telegram messages. Changed to `false`.

### 5. Don't let Claude sessions touch bot tokens
A `/do` task spawned a Claude session that read the CCBot token from events.jsonl and called Telegram's `close()` API, permanently corrupting the token. Token was leaked because the BotFather message was sent via `/do` and logged to events.jsonl.

### 6. Try before planning
maw.js was already installed and could have solved the tmux problem in 30 seconds. Instead spent hours planning workarounds. Test first, plan later.

## Pending — Next Session

### Priority 1: Absorb CCBot's monitoring into oracle-bot
Port these patterns from CCBot (Python → TypeScript):
- `session_monitor.py` — watch Claude's JSONL transcript files (in `~/.claude/projects/`)
- `terminal_parser.py` — parse output to detect responses, tool use, permissions
- `handlers/interactive_ui.py` — grammY inline keyboards for permission prompts

Key insight: Monitor JSONL files, NOT tmux capture-pane. Structured data beats raw terminal text.

CCBot source at: `/Users/jarkius/.local/share/uv/tools/ccbot/lib/python3.13/site-packages/ccbot/`

### Priority 2: Fix oracle-bot's 409 startup
Oracle-bot sometimes hits 409 on startup and retries with 35s delay. Add the webhook trick (`setWebhook` then `deleteWebhook`) before starting polling to force-clear stale sessions.

### Priority 3: Events.jsonl rotation
Currently unbounded growth. Add rotation at 1000 lines or daily.

## Key Files
- `scripts/lib/pulse.ts` — shared module (appendLine, emitEvent, notifyTelegram)
- `scripts/oracle-bot.ts` — GPT bridge + tmux integration
- `scripts/oracle-daemon.ts` — self-healing supervisor
- `.agents/skills/oracle-nerve/` — skill + known-fixes.json
- `.agent/agents/oracle-nerve-agent.md` — audit agent
- `ψ/pulse/dispatch-rules.json` — 11 rules including nerve-* self-healing
- `~/.ccbot/.env` — CCBot config (token: @CCBotOracle_bot, save for future)
- `~/.claude/hooks/check-telegram-inbox.sh` — UserPromptSubmit hook
- `~/.claude/settings.json` — hook configuration

## Architecture

```
Oracle Bot (@jarkius_bot) — SINGLE BOT
├── GPT brain (answers questions with live context)
├── /do tasks (headless claude -p OR tmux send-keys)
├── Inbox bridge (telegram-queue.jsonl → Claude sees on startup)
├── PULSE events → dispatch engine → auto-fix
├── Heartbeat sensor → state transition events
├── Oracle Nerve → known-fixes.json → self-healing
└── [NEXT] Real-time Claude output monitoring (absorb from CCBot)
```
