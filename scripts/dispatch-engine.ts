#!/usr/bin/env bun
/**
 * Dispatch Engine — Event-driven PULSE processor
 * Watches events.jsonl for new events, evaluates dispatch rules, sends Telegram notifications
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "917848477";

const CWD = "/Users/jarkius/workspace/products/trackattendance";
const EVENTS_PATH = `${CWD}/ψ/pulse/events.jsonl`;
const RULES_PATH = `${CWD}/ψ/pulse/dispatch-rules.json`;
const SESSION_CONTEXT_PATH = `${CWD}/ψ/inbox/session-context.md`;

const POLL_INTERVAL_MS = 2_000;
const CONTEXT_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

// ─── Types ───────────────────────────────────────────────────────────────────

interface PulseEvent {
  timestamp: string;
  type: string;
  agent: string;
  data: Record<string, unknown>;
}

interface DispatchRule {
  id: string;
  trigger: { event: string; [key: string]: unknown };
  action: { notify: boolean; message: string };
  cooldown_minutes: number;
}

interface RulesFile {
  version: number;
  description: string;
  rules: DispatchRule[];
}

// ─── Telegram Notify ─────────────────────────────────────────────────────────

async function notify(msg: string): Promise<void> {
  if (!BOT_TOKEN) {
    console.log("[DISPATCH] No bot token, skipping notification:", msg);
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: msg }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    console.error("[DISPATCH] Notify failed:", e);
  }
}

// ─── Rules Loading ───────────────────────────────────────────────────────────

let rules: DispatchRule[] = [];

async function loadRules(): Promise<void> {
  try {
    const file = Bun.file(RULES_PATH);
    if (!(await file.exists())) {
      console.log("[DISPATCH] No dispatch rules file found");
      rules = [];
      return;
    }
    const data = (await file.json()) as RulesFile;
    rules = data.rules || [];
    console.log(`[DISPATCH] Loaded ${rules.length} rules`);
  } catch (e) {
    console.error("[DISPATCH] Failed to load rules:", e);
    rules = [];
  }
}

// ─── Cooldown Tracking ──────────────────────────────────────────────────────

const cooldowns = new Map<string, number>();

function isCoolingDown(ruleId: string, cooldownMinutes: number): boolean {
  if (cooldownMinutes <= 0) return false;
  const lastFired = cooldowns.get(ruleId);
  if (!lastFired) return false;
  return Date.now() - lastFired < cooldownMinutes * 60 * 1000;
}

function markFired(ruleId: string): void {
  cooldowns.set(ruleId, Date.now());
}

// ─── Template Substitution ───────────────────────────────────────────────────

function applyTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\$\{data\.(\w+)\}/g, (_, key) => {
    const val = data[key];
    return val !== undefined ? String(val) : `(${key})`;
  });
}

// ─── Rule Evaluation ─────────────────────────────────────────────────────────

function matchesRule(event: PulseEvent, rule: DispatchRule): boolean {
  // Match event type
  if (rule.trigger.event !== event.type) return false;

  // Match additional trigger fields against event data
  for (const [key, val] of Object.entries(rule.trigger)) {
    if (key === "event") continue;
    if (event.data[key] !== undefined && event.data[key] !== val) return false;
  }

  return true;
}

async function evaluateEvent(event: PulseEvent): Promise<void> {
  for (const rule of rules) {
    if (!matchesRule(event, rule)) continue;
    if (isCoolingDown(rule.id, rule.cooldown_minutes)) {
      console.log(`[DISPATCH] Rule '${rule.id}' is cooling down, skipping`);
      continue;
    }

    const message = applyTemplate(rule.action.message, event.data);
    console.log(`[DISPATCH] Rule '${rule.id}' fired: ${message}`);

    if (rule.action.notify) {
      await notify(message);
    }

    markFired(rule.id);
  }
}

// ─── Event File Polling ──────────────────────────────────────────────────────

let fileOffset = 0;

async function seekToEnd(): Promise<void> {
  try {
    const file = Bun.file(EVENTS_PATH);
    if (await file.exists()) {
      const text = await file.text();
      fileOffset = text.length;
      console.log(`[DISPATCH] Seeked to end of events file (offset: ${fileOffset})`);
    } else {
      fileOffset = 0;
      console.log("[DISPATCH] Events file does not exist yet, starting from 0");
    }
  } catch {
    fileOffset = 0;
  }
}

async function pollNewEvents(): Promise<void> {
  try {
    const file = Bun.file(EVENTS_PATH);
    if (!(await file.exists())) return;

    const text = await file.text();
    if (text.length <= fileOffset) return;

    const newContent = text.slice(fileOffset);
    fileOffset = text.length;

    const lines = newContent.split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const event = JSON.parse(line) as PulseEvent;
        await evaluateEvent(event);
      } catch (e) {
        console.error("[DISPATCH] Failed to parse event line:", e);
      }
    }
  } catch (e) {
    console.error("[DISPATCH] Poll error:", e);
  }
}

// ─── Session Context Auto-Update ─────────────────────────────────────────────

async function updateSessionContext(): Promise<void> {
  try {
    const file = Bun.file(EVENTS_PATH);
    if (!(await file.exists())) return;

    const text = await file.text();
    const lines = text.trim().split("\n").filter(Boolean);
    const recent = lines.slice(-50);

    const events: PulseEvent[] = [];
    for (const line of recent) {
      try {
        events.push(JSON.parse(line) as PulseEvent);
      } catch {}
    }

    if (events.length === 0) return;

    // Group events by type
    const typeCounts = new Map<string, number>();
    const agents = new Set<string>();
    let lastTimestamp = "";

    for (const ev of events) {
      typeCounts.set(ev.type, (typeCounts.get(ev.type) || 0) + 1);
      agents.add(ev.agent);
      lastTimestamp = ev.timestamp;
    }

    const typesSummary = Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `- ${type}: ${count}`)
      .join("\n");

    const recentErrors = events
      .filter((e) => e.type === "error" || e.type.includes("fail"))
      .slice(-5)
      .map((e) => `- [${e.timestamp}] ${e.agent}: ${JSON.stringify(e.data).slice(0, 100)}`)
      .join("\n");

    const context = [
      `# Session Context (auto-generated)`,
      ``,
      `Last updated: ${new Date().toISOString()}`,
      `Last event: ${lastTimestamp}`,
      `Active agents: ${Array.from(agents).join(", ")}`,
      ``,
      `## Recent Event Summary (last ${events.length} events)`,
      ``,
      typesSummary,
      ``,
      recentErrors ? `## Recent Errors\n\n${recentErrors}\n` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await Bun.write(SESSION_CONTEXT_PATH, context);
    console.log("[DISPATCH] Session context updated");
  } catch (e) {
    console.error("[DISPATCH] Failed to update session context:", e);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("⚡ Dispatch Engine starting...");

  await loadRules();
  await seekToEnd();

  // Poll for new events
  const pollTimer = setInterval(pollNewEvents, POLL_INTERVAL_MS);

  // Auto-update session context every 5 minutes
  const contextTimer = setInterval(updateSessionContext, CONTEXT_UPDATE_INTERVAL_MS);

  // Initial context update
  await updateSessionContext();

  console.log("⚡ Dispatch Engine is running");
  console.log(`   Rules: ${rules.length}`);
  console.log(`   Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`   Context update: every ${CONTEXT_UPDATE_INTERVAL_MS / 1000}s`);

  // Graceful shutdown
  const stop = () => {
    console.log("⚡ Dispatch Engine shutting down...");
    clearInterval(pollTimer);
    clearInterval(contextTimer);
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
