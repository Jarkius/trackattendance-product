# CCBot Key Patterns to Port to TypeScript

> Extracted from six-ddc/ccbot. These are the patterns that make CCBot work.
> Port to oracle-bot.ts — don't reinvent.

## 1. JSONL Transcript Monitoring (session_monitor.py)

The smart way to watch Claude's output. NOT capture-pane — JSONL files.

```python
# Claude writes structured output to JSONL files in ~/.claude/projects/
# CCBot watches these files with byte-offset tracking

class SessionMonitor:
    async def _poll_session(self, tracked: TrackedSession):
        path = tracked.file_path

        # Skip unchanged files (mtime check)
        mtime = path.stat().st_mtime
        if mtime == tracked.last_mtime:
            return
        tracked.last_mtime = mtime

        # Read only NEW bytes (offset tracking)
        async with aiofiles.open(path, "r") as f:
            await f.seek(tracked.byte_offset)
            new_content = await f.read()
            tracked.byte_offset = await f.tell()

        # Parse each new line
        for line in new_content.strip().split("\n"):
            entry = json.loads(line)
            messages = self._parser.parse(entry)
            for msg in messages:
                await self._callback(msg)
```

**TypeScript equivalent:**
```typescript
async function pollTranscript(path: string, offset: number): Promise<{lines: string[], newOffset: number}> {
  const stat = await Bun.file(path).stat();
  // ... read from offset, parse JSONL lines
}
```

## 2. Transcript Parser (transcript_parser.py)

Parses Claude's JSONL entries into structured messages:

```python
class TranscriptParser:
    def parse(self, entry: dict) -> list[NewMessage]:
        msg_type = entry.get("type")

        if msg_type == "assistant":
            # Claude's response text
            content = entry.get("message", {}).get("content", [])
            for block in content:
                if block.get("type") == "text":
                    yield NewMessage(text=block["text"], content_type="text", is_complete=True)
                elif block.get("type") == "tool_use":
                    yield NewMessage(text=f"Using {block['name']}...", content_type="tool_use", tool_name=block["name"])
                elif block.get("type") == "thinking":
                    yield NewMessage(text=block["thinking"], content_type="thinking")

        elif msg_type == "result":
            # Tool result
            yield NewMessage(text=entry.get("result", ""), content_type="tool_result")
```

## 3. Hook-Based Session Tracking (hook.py)

CCBot uses Claude Code's `SessionStart` hook to auto-track sessions:

```python
# In Claude Code settings, add a hook:
# "SessionStart": [{"type": "command", "command": "ccbot hook <session_id> <cwd>"}]

# The hook writes session info to ~/.ccbot/sessions.json
def hook_main():
    session_id = sys.argv[2]
    cwd = sys.argv[3]

    # Find which tmux window this session is in
    pane_pid = os.getppid()
    window_id = find_tmux_window_by_pid(pane_pid)

    # Save mapping: window_id -> session_id -> transcript path
    state = load_state()
    state[window_id] = {"session_id": session_id, "cwd": cwd}
    save_state(state)
```

**Key**: Claude's transcript files are at:
```
~/.claude/projects/<project-hash>/<session-id>.jsonl
```

## 4. Interactive Permission UI (handlers/interactive_ui.py)

When Claude needs permission, show inline buttons:

```python
# Detect permission prompt in Claude's output
async def check_interactive_prompt(text: str, bot, chat_id, thread_id):
    if "Do you want to proceed?" in text or "Allow" in text:
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("✅ Allow", callback_data="perm:allow"),
             InlineKeyboardButton("❌ Deny", callback_data="perm:deny")],
            [InlineKeyboardButton("🔓 Allow All", callback_data="perm:allowall")]
        ])
        await bot.send_message(chat_id, "Permission needed:",
                               reply_markup=keyboard,
                               message_thread_id=thread_id)

# Handle button press
async def callback_handler(update, context):
    data = update.callback_query.data
    if data == "perm:allow":
        await send_keys_to_tmux(target, "y\n")
    elif data == "perm:deny":
        await send_keys_to_tmux(target, "n\n")
```

**grammY equivalent:**
```typescript
import { InlineKeyboard } from "grammy";

const keyboard = new InlineKeyboard()
  .text("✅ Allow", "perm:allow")
  .text("❌ Deny", "perm:deny")
  .row()
  .text("🔓 Allow All", "perm:allowall");

await ctx.reply("Permission needed:", { reply_markup: keyboard });

bot.callbackQuery("perm:allow", async (ctx) => {
  await sendToClaudeTmux(pane, "y");
  await ctx.answerCallbackQuery("Allowed");
});
```

## 5. Message Queue with Rate Limiting (handlers/message_queue.py)

Telegram has rate limits. CCBot queues messages:

```python
class MessageQueue:
    def __init__(self, bot, chat_id, thread_id):
        self._buffer = ""
        self._flush_task = None
        self._flush_interval = 1.0  # seconds

    async def append(self, text: str):
        self._buffer += text
        if not self._flush_task:
            self._flush_task = asyncio.create_task(self._flush_after_delay())

    async def _flush_after_delay(self):
        await asyncio.sleep(self._flush_interval)
        if self._buffer:
            await self._send(self._buffer)
            self._buffer = ""
        self._flush_task = None
```

## 6. Smart tmux Text Sending (tmux_manager.py)

Already ported via maw.js. But CCBot has one extra detail — 150ms delay for Claude's input processing:

```python
async def send_text(target, text):
    if len(text) > 500 or "\n" in text:
        # Buffer method
        await load_buffer(text)
        await paste_buffer(target)
    else:
        await send_keys_literal(target, text)

    await asyncio.sleep(0.15)  # Claude needs 150ms to process input
    await send_keys(target, "Enter")
```

## File Locations

All source saved at: `ψ/learn/ccbot-patterns/`

| File | Lines | What to port |
|------|-------|-------------|
| `session_monitor.py` | 526 | Byte-offset JSONL watching |
| `transcript_parser.py` | 762 | Parse Claude's JSONL output |
| `terminal_parser.py` | 365 | Detect responses, tool use, permissions |
| `hook.py` | 276 | SessionStart hook for session tracking |
| `session.py` | 893 | Session lifecycle management |
| `handlers/interactive_ui.py` | 278 | Inline keyboard for permissions |
| `handlers/message_queue.py` | 604 | Rate-limited message sending |
