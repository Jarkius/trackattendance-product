# Telegram Bot Polling Conflicts — Don't Run Two Bots From Same Machine

**Date**: 2026-03-16
**Context**: Trying to run CCBot + oracle-bot simultaneously
**Confidence**: High

## Key Learning

Two Telegram bots using long-polling (`getUpdates`) from the same machine WILL conflict, even with completely different bot tokens. Telegram's server at `149.154.166.110` cross-contaminates the polling sessions, causing 409 Conflict errors that crash python-telegram-bot (no recovery) and force grammY into 35s retry loops.

Additional traps:
- Calling `getUpdates` manually via `curl` during debugging **consumes updates** before the bot can see them — you become the bug you're debugging
- `drop_pending_updates: true` throws away all messages on every restart
- Telegram's `close()` API permanently invalidates a bot session until you regenerate the token
- Bot tokens logged in JSONL files can be picked up by spawned Claude sessions, which may call Telegram APIs with the wrong token

## The Pattern

**One machine = one polling bot.** If you need multiple bots:
1. Use webhooks for one of them (requires public URL)
2. Run them on separate machines
3. Absorb both into a single bot (our solution)

**The webhook trick** clears stale server-side polling sessions:
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://example.com"
sleep 1
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

## Why This Matters

- 2+ hours wasted debugging a server-side issue that can't be fixed client-side
- CCBot is architecturally sound but can't coexist with oracle-bot on the same machine
- The solution is absorption: port CCBot's monitoring patterns into oracle-bot
- Never leak bot tokens into log files that AI agents might read

## Tags

`telegram`, `409-conflict`, `polling`, `ccbot`, `oracle-bot`, `debugging-trap`, `observer-effect`
