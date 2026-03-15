#!/usr/bin/env bun
/**
 * Inbox Utilities — Telegram ↔ Claude shared inbox management
 *
 * The inbox lives at ψ/inbox/telegram-queue.jsonl
 * - oracle-bot.ts WRITES to it after every GPT conversation and /do result
 * - dispatch-engine.ts READS it and includes unread items in session-context.md
 * - Claude sees unread messages via session-context.md on startup
 *
 * This script provides CLI utilities for managing the inbox:
 *   bun scripts/inbox-daemon.ts status    — show unread count
 *   bun scripts/inbox-daemon.ts list      — list unread messages
 *   bun scripts/inbox-daemon.ts read      — mark all as read
 *   bun scripts/inbox-daemon.ts clear     — archive and reset inbox
 */

const CWD = "/Users/jarkius/workspace/products/trackattendance";
const INBOX_PATH = `${CWD}/ψ/inbox/telegram-queue.jsonl`;
const ARCHIVE_DIR = `${CWD}/ψ/archive/inbox`;

interface InboxEntry {
  id: string;
  ts: string;
  type: "chat" | "do_result" | "note";
  user: string;
  gpt: string;
  status: "unread" | "read";
}

async function loadEntries(): Promise<InboxEntry[]> {
  const file = Bun.file(INBOX_PATH);
  if (!(await file.exists())) return [];
  const text = await file.text();
  return text.trim().split("\n").filter(Boolean).map((line) => {
    try { return JSON.parse(line) as InboxEntry; } catch { return null; }
  }).filter(Boolean) as InboxEntry[];
}

async function saveEntries(entries: InboxEntry[]): Promise<void> {
  const content = entries.map((e) => JSON.stringify(e)).join("\n") + (entries.length > 0 ? "\n" : "");
  await Bun.write(INBOX_PATH, content);
}

const command = process.argv[2] || "status";

switch (command) {
  case "status": {
    const entries = await loadEntries();
    const unread = entries.filter((e) => e.status === "unread");
    const read = entries.filter((e) => e.status === "read");
    console.log(`📬 Inbox: ${unread.length} unread, ${read.length} read, ${entries.length} total`);
    break;
  }

  case "list": {
    const entries = await loadEntries();
    const unread = entries.filter((e) => e.status === "unread");
    if (unread.length === 0) {
      console.log("📭 No unread messages.");
      break;
    }
    for (const e of unread) {
      const time = new Date(e.ts).toLocaleString("en-GB", { hour12: false });
      const icon = e.type === "do_result" ? "⚡" : e.type === "note" ? "📝" : "💬";
      console.log(`\n${icon} [${time}] (${e.id})`);
      console.log(`   User: ${e.user.slice(0, 200)}`);
      console.log(`   GPT:  ${e.gpt.slice(0, 200)}`);
    }
    break;
  }

  case "read": {
    const entries = await loadEntries();
    let count = 0;
    for (const e of entries) {
      if (e.status === "unread") { e.status = "read"; count++; }
    }
    await saveEntries(entries);
    console.log(`✅ Marked ${count} message(s) as read.`);
    break;
  }

  case "clear": {
    const entries = await loadEntries();
    if (entries.length === 0) {
      console.log("📭 Inbox already empty.");
      break;
    }
    // Archive before clearing
    const archiveFile = `${ARCHIVE_DIR}/${new Date().toISOString().slice(0, 10)}_inbox.jsonl`;
    const { mkdirSync } = await import("fs");
    mkdirSync(ARCHIVE_DIR, { recursive: true });
    await Bun.write(archiveFile, entries.map((e) => JSON.stringify(e)).join("\n") + "\n", { append: true });
    await Bun.write(INBOX_PATH, "");
    console.log(`🗄️ Archived ${entries.length} entries to ${archiveFile}`);
    console.log(`📭 Inbox cleared.`);
    break;
  }

  default:
    console.log("Usage: bun scripts/inbox-daemon.ts [status|list|read|clear]");
}
