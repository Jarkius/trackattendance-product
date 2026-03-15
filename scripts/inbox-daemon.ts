#!/usr/bin/env bun
/**
 * Inbox Daemon — watches Telegram bot log for new messages
 * Writes unread messages to a file that Claude Code checks every response
 *
 * Run: bun scripts/inbox-daemon.ts
 */

const INBOX_FILE = "/tmp/claude-inbox.txt";
const BOT_LOG = "/tmp/telegram-bot.log";
const CHECK_INTERVAL = 3000; // 3 seconds

let lastLineCount = 0;

async function checkNewMessages() {
  try {
    const log = await Bun.file(BOT_LOG).text().catch(() => "");
    const lines = log.split("\n").filter(l => l.includes("📩"));

    if (lines.length > lastLineCount) {
      const newMessages = lines.slice(lastLineCount);
      lastLineCount = lines.length;

      if (newMessages.length > 0) {
        const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
        const alert = newMessages.map(m => `[${timestamp}] ${m}`).join("\n") + "\n";

        // Append to inbox file
        const existing = await Bun.file(INBOX_FILE).text().catch(() => "");
        await Bun.write(INBOX_FILE, existing + alert);

        console.log(`📬 ${newMessages.length} new message(s) written to inbox`);
      }
    }
  } catch (e) {
    // Silent fail - don't crash daemon
  }
}

// Initialize with current count (don't replay old messages)
const initLog = await Bun.file(BOT_LOG).text().catch(() => "");
lastLineCount = initLog.split("\n").filter(l => l.includes("📩")).length;
console.log(`👁️ Inbox daemon started. Watching for new messages (${lastLineCount} existing skipped)`);

// Clear inbox file
await Bun.write(INBOX_FILE, "");

setInterval(checkNewMessages, CHECK_INTERVAL);
