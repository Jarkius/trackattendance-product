#!/usr/bin/env bun
/**
 * Dispatch Engine v2.0 — Event-driven PULSE processor with auto-fix
 *
 * Part of Oracle Nerve — the comparator + actuator in the feedback loop.
 * Watches events.jsonl, matches dispatch rules, sends notifications,
 * and can auto-fix known issues using the known-fixes registry.
 *
 * Flow: event → rule match → notify + autofix lookup → fix or escalate
 */

import {
  emitEvent, notifyTelegram, appendLine, log,
  CWD, EVENTS_PATH, DISPATCH_RULES_PATH, SESSION_CONTEXT_PATH,
  TELEGRAM_INBOX_PATH, FIX_REQUESTS_PATH, KNOWN_FIXES_PATH,
} from "./lib/pulse.ts";

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
  action: { notify: boolean; autofix?: boolean; message: string };
  cooldown_minutes: number;
}

interface RulesFile {
  version: number;
  description: string;
  rules: DispatchRule[];
}

interface KnownFix {
  id: string;
  match: { agent?: string; error_contains?: string };
  fix?: string;            // shell command (auto: true)
  do_command?: string;      // claude prompt (auto: false)
  description?: string;
  auto: boolean;
}

interface KnownFixesFile {
  version: number;
  fixes: KnownFix[];
}

// ─── Rules Loading ───────────────────────────────────────────────────────────

let rules: DispatchRule[] = [];

async function loadRules(): Promise<void> {
  try {
    const file = Bun.file(DISPATCH_RULES_PATH);
    if (!(await file.exists())) { rules = []; return; }
    const data = (await file.json()) as RulesFile;
    rules = data.rules || [];
    log("info", "dispatch", `Loaded ${rules.length} rules`);
  } catch (e) {
    log("error", "dispatch", "Failed to load rules", { error: String(e) });
    rules = [];
  }
}

// ─── Known Fixes Loading ────────────────────────────────────────────────────

let knownFixes: KnownFix[] = [];

async function loadKnownFixes(): Promise<void> {
  try {
    const file = Bun.file(KNOWN_FIXES_PATH);
    if (!(await file.exists())) { knownFixes = []; return; }
    const data = (await file.json()) as KnownFixesFile;
    knownFixes = data.fixes || [];
    log("info", "dispatch", `Loaded ${knownFixes.length} known fixes`);
  } catch (e) {
    log("debug", "dispatch", "No known-fixes.json yet", { error: String(e) });
    knownFixes = [];
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

// ─── Rule Matching ──────────────────────────────────────────────────────────

function matchesRule(event: PulseEvent, rule: DispatchRule): boolean {
  if (rule.trigger.event !== event.type) return false;
  for (const [key, val] of Object.entries(rule.trigger)) {
    if (key === "event") continue;
    if (event.data[key] !== undefined && event.data[key] !== val) return false;
  }
  return true;
}

// ─── Auto-Fix Logic ─────────────────────────────────────────────────────────

function findMatchingFix(event: PulseEvent): KnownFix | null {
  for (const fix of knownFixes) {
    const agentMatch = !fix.match.agent || fix.match.agent === event.agent;
    const errorMatch = !fix.match.error_contains || (
      String(event.data.error || event.data.detail || "").includes(fix.match.error_contains)
    );
    if (agentMatch && errorMatch) return fix;
  }
  return null;
}

async function executeAutoFix(event: PulseEvent, fix: KnownFix): Promise<void> {
  log("info", "dispatch", `Auto-fix matched: ${fix.id}`, { fix: fix.description || fix.id });

  if (fix.auto && fix.fix) {
    // Direct shell command
    log("info", "dispatch", `Executing auto-fix: ${fix.fix}`);
    try {
      const proc = Bun.spawn(["bash", "-c", fix.fix], {
        cwd: CWD, stdout: "pipe", stderr: "pipe",
        env: process.env,
      });
      const stdout = await new Response(proc.stdout).text();
      await proc.exited;

      await emitEvent("nerve:fix-result", "dispatch-engine", {
        fixId: fix.id,
        auto: true,
        exitCode: proc.exitCode,
        output: stdout.slice(0, 300),
      });

      log(proc.exitCode === 0 ? "info" : "warn", "dispatch", `Auto-fix ${fix.id} completed`, { exitCode: proc.exitCode });
    } catch (e) {
      log("error", "dispatch", `Auto-fix ${fix.id} failed`, { error: String(e) });
      await emitEvent("nerve:fix-result", "dispatch-engine", { fixId: fix.id, auto: true, error: String(e) });
    }
  } else if (fix.do_command) {
    // Spawn Claude
    log("info", "dispatch", `Spawning Claude for fix: ${fix.id}`);
    try {
      const proc = Bun.spawn([
        "claude", "-p", fix.do_command,
        "--output-format", "text",
        "--allowedTools", "Bash,Read,Grep,Glob",
        "--max-turns", "5",
      ], {
        cwd: CWD, stdout: "pipe", stderr: "pipe",
        env: { ...process.env, CLAUDE_CODE_ENTRYPOINT: "cli" },
      });

      const timeout = setTimeout(() => { try { proc.kill(); } catch {} }, 3 * 60_000);
      const stdout = await new Response(proc.stdout).text();
      await proc.exited;
      clearTimeout(timeout);

      await emitEvent("nerve:fix-result", "dispatch-engine", {
        fixId: fix.id,
        auto: false,
        exitCode: proc.exitCode,
        output: stdout.slice(0, 500),
      });

      // Notify human with result
      await notifyTelegram(`🔧 Auto-fix (${fix.id}):\n${stdout.slice(0, 2000)}`);
    } catch (e) {
      log("error", "dispatch", `Claude fix ${fix.id} failed`, { error: String(e) });
      await emitEvent("nerve:fix-result", "dispatch-engine", { fixId: fix.id, auto: false, error: String(e) });
    }
  }
}

async function writeFixRequest(event: PulseEvent): Promise<void> {
  const entry = {
    id: `fr_${Date.now()}`,
    ts: new Date().toISOString(),
    event: event.type,
    agent: event.agent,
    error: String(event.data.error || event.data.detail || "unknown"),
    status: "open",
  };
  try {
    await appendLine(FIX_REQUESTS_PATH, JSON.stringify(entry));
    log("info", "dispatch", `Fix request created: ${entry.id}`);
  } catch (e) {
    log("error", "dispatch", "Failed to write fix request", { error: String(e) });
  }
}

// ─── Rule Evaluation ────────────────────────────────────────────────────────

async function evaluateEvent(event: PulseEvent): Promise<void> {
  for (const rule of rules) {
    if (!matchesRule(event, rule)) continue;
    if (isCoolingDown(rule.id, rule.cooldown_minutes)) {
      log("debug", "dispatch", `Rule '${rule.id}' cooling down, skipped`);
      continue;
    }

    const message = applyTemplate(rule.action.message, event.data);
    log("info", "dispatch", `Rule '${rule.id}' fired: ${message}`);

    if (rule.action.notify) {
      await notifyTelegram(message);
    }

    // Auto-fix: look up known fixes
    if (rule.action.autofix) {
      const fix = findMatchingFix(event);
      if (fix) {
        await executeAutoFix(event, fix);
      } else {
        log("info", "dispatch", `No known fix for event, writing fix request`);
        await writeFixRequest(event);
      }
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
      log("info", "dispatch", `Seeked to end of events (offset: ${fileOffset})`);
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
        log("warn", "dispatch", "Failed to parse event line", { error: String(e).slice(0, 100) });
      }
    }
  } catch (e) {
    log("error", "dispatch", "Poll error", { error: String(e) });
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
      try { events.push(JSON.parse(line) as PulseEvent); } catch {}
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
      .filter((e) => e.type === "error" || e.type.includes("fail") || e.type.includes("escalation"))
      .slice(-5)
      .map((e) => `- [${e.timestamp}] ${e.agent}: ${JSON.stringify(e.data).slice(0, 100)}`)
      .join("\n");

    // Read Telegram inbox
    let inboxSection = "";
    try {
      const inboxFile = Bun.file(TELEGRAM_INBOX_PATH);
      if (await inboxFile.exists()) {
        const inboxText = await inboxFile.text();
        const inboxLines = inboxText.trim().split("\n").filter(Boolean);
        const unread: Array<{ ts: string; type: string; user: string; gpt: string }> = [];
        for (const line of inboxLines) {
          try {
            const entry = JSON.parse(line);
            if (entry.status === "unread") unread.push(entry);
          } catch {}
        }
        if (unread.length > 0) {
          const items = unread.slice(-15).map((e) => {
            const time = new Date(e.ts).toLocaleTimeString("en-GB", { hour12: false });
            const icon = e.type === "do_result" ? "⚡" : e.type === "note" ? "📝" : "💬";
            return `- ${icon} [${time}] User: "${e.user.slice(0, 100)}" → GPT: "${e.gpt.slice(0, 120)}"`;
          });
          inboxSection = `## Telegram Inbox (${unread.length} unread)\n\n${items.join("\n")}\n`;
        }
      }
    } catch {}

    // Read fix requests
    let fixSection = "";
    try {
      const fixFile = Bun.file(FIX_REQUESTS_PATH);
      if (await fixFile.exists()) {
        const fixText = await fixFile.text();
        const fixLines = fixText.trim().split("\n").filter(Boolean);
        const openFixes: Array<{ id: string; ts: string; agent: string; error: string }> = [];
        for (const line of fixLines) {
          try {
            const entry = JSON.parse(line);
            if (entry.status === "open") openFixes.push(entry);
          } catch {}
        }
        if (openFixes.length > 0) {
          const items = openFixes.slice(-10).map((f) => {
            const time = new Date(f.ts).toLocaleTimeString("en-GB", { hour12: false });
            return `- [${time}] ${f.agent}: ${f.error.slice(0, 120)}`;
          });
          fixSection = `## Open Fix Requests (${openFixes.length})\n\n${items.join("\n")}\n`;
        }
      }
    } catch {}

    const context = [
      `# Session Context (auto-generated)`,
      ``,
      `Last updated: ${new Date().toISOString()}`,
      `Last event: ${lastTimestamp}`,
      `Active agents: ${Array.from(agents).join(", ")}`,
      ``,
      inboxSection,
      fixSection,
      `## Recent Event Summary (last ${events.length} events)`,
      ``,
      typesSummary,
      ``,
      recentErrors ? `## Recent Errors & Escalations\n\n${recentErrors}\n` : "",
    ].filter(Boolean).join("\n");

    await Bun.write(SESSION_CONTEXT_PATH, context);
    log("debug", "dispatch", "Session context updated");
  } catch (e) {
    log("error", "dispatch", "Failed to update session context", { error: String(e) });
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log("info", "dispatch", "Dispatch Engine v2.0 starting...");

  await loadRules();
  await loadKnownFixes();
  await seekToEnd();

  // Reload known-fixes every 5 min (so new fixes are picked up without restart)
  setInterval(loadKnownFixes, 5 * 60_000);
  // Reload rules every 5 min too
  setInterval(loadRules, 5 * 60_000);

  const pollTimer = setInterval(pollNewEvents, POLL_INTERVAL_MS);
  const contextTimer = setInterval(updateSessionContext, CONTEXT_UPDATE_INTERVAL_MS);
  await updateSessionContext();

  log("info", "dispatch", "Dispatch Engine v2.0 running", {
    rules: rules.length,
    knownFixes: knownFixes.length,
    pollMs: POLL_INTERVAL_MS,
  });

  const stop = () => {
    log("info", "dispatch", "Shutting down...");
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
