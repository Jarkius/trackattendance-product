/**
 * Shared PULSE module — event emission, Telegram notifications, constants
 * Used by: oracle-bot, dispatch-engine, heartbeat, oracle-daemon
 *
 * This is the nervous system's shared infrastructure.
 * All events flow through here into events.jsonl — the audit trail.
 *
 * IMPORTANT: Uses node:fs/promises appendFile, NOT Bun.write with { append: true }
 * because Bun.write silently ignores the append flag and overwrites the file.
 */

import { appendFile } from "node:fs/promises";

export const CWD = "/Users/jarkius/workspace/products/trackattendance";
export const EVENTS_PATH = `${CWD}/ψ/pulse/events.jsonl`;
export const HEARTBEAT_PATH = `${CWD}/ψ/pulse/heartbeat.json`;
export const SESSION_CONTEXT_PATH = `${CWD}/ψ/inbox/session-context.md`;
export const TELEGRAM_INBOX_PATH = `${CWD}/ψ/inbox/telegram-queue.jsonl`;
export const FIX_REQUESTS_PATH = `${CWD}/ψ/inbox/fix-requests.jsonl`;
export const CHAT_HISTORY_PATH = `${CWD}/ψ/pulse/chat-history.jsonl`;
export const DISPATCH_RULES_PATH = `${CWD}/ψ/pulse/dispatch-rules.json`;
export const KNOWN_FIXES_PATH = `${CWD}/.agents/skills/oracle-nerve/known-fixes.json`;
export const RETROSPECTIVES_DIR = `${CWD}/ψ/memory/retrospectives`;
export const HANDOFFS_DIR = `${CWD}/ψ/inbox/handoff`;

export const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
export const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "917848477";
export const CLOUD_API = process.env.CLOUD_API_URL || "https://trackattendance-api-1093578683498.asia-southeast1.run.app";
export const LANDING_URL = "https://trackattendance.jarkius.com";

// ─── Log Levels ─────────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

export function log(level: LogLevel, agent: string, message: string, data?: Record<string, unknown>): void {
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL]) return;

  const ts = new Date().toISOString();
  const prefix = { debug: "🔍", info: "ℹ️", warn: "⚠️", error: "❌" }[level];
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[${ts}] ${prefix} [${agent}] ${message}${dataStr}`);
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PulseEvent {
  timestamp: string;
  type: string;
  agent: string;
  data: Record<string, unknown>;
}

// ─── Event Emission ─────────────────────────────────────────────────────────

export async function emitEvent(type: string, agent: string, data: Record<string, unknown> = {}): Promise<void> {
  const event: PulseEvent = {
    timestamp: new Date().toISOString(),
    type,
    agent,
    data,
  };
  try {
    const line = JSON.stringify(event) + "\n";
    await appendFile(EVENTS_PATH, line);
  } catch (e) {
    console.error("[PULSE] Failed to emit event:", e);
  }
}

// Shared append helper — use this instead of Bun.write for all JSONL files
export async function appendLine(filePath: string, data: string): Promise<void> {
  await appendFile(filePath, data.endsWith("\n") ? data : data + "\n");
}

// ─── Telegram Notification (raw API, no grammY dependency) ──────────────────

export async function notifyTelegram(message: string): Promise<void> {
  if (!BOT_TOKEN) {
    console.log("[NOTIFY] No bot token, skipping:", message.slice(0, 80));
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    console.error("[NOTIFY] Telegram send failed:", e);
  }
}
