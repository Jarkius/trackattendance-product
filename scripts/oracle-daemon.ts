#!/usr/bin/env bun
/**
 * Oracle Daemon v2.0 — Self-Healing Supervisor
 *
 * Part of Oracle Nerve — implements the escalation ladder.
 * Instead of "restart 3x then die silently", this supervisor:
 *   L1: Restart → L2: Reset + restart → L3: Notify human →
 *   L4: Spawn Claude to diagnose → L5: Standby with periodic retry
 *
 * Every state transition emits a PULSE event for the audit trail.
 */

import { emitEvent, notifyTelegram, appendLine, log, CWD } from "./lib/pulse.ts";

// ─── Daemon Registry ─────────────────────────────────────────────────────────

interface DaemonConfig {
  name: string;
  script: string;
  cwd?: string;  // optional override (defaults to CWD)
  process: ReturnType<typeof Bun.spawn> | null;
  logFile: string;
  // Escalation state
  escalationLevel: number;
  restarts: number;
  restartsThisHour: number;
  lastRestartHour: number;
  exitHistory: number[];        // last 5 exit codes for diagnosis
  escalationTimer: ReturnType<typeof setTimeout> | null;
  standbyTimer: ReturnType<typeof setInterval> | null;
}

const DAEMONS: DaemonConfig[] = [
  { name: "oracle-bot", script: "scripts/oracle-bot.ts", process: null, logFile: "/tmp/oracle-oracle-bot.log", escalationLevel: 0, restarts: 0, restartsThisHour: 0, lastRestartHour: 0, exitHistory: [], escalationTimer: null, standbyTimer: null },
  { name: "dispatch-engine", script: "scripts/dispatch-engine.ts", process: null, logFile: "/tmp/oracle-dispatch-engine.log", escalationLevel: 0, restarts: 0, restartsThisHour: 0, lastRestartHour: 0, exitHistory: [], escalationTimer: null, standbyTimer: null },
  { name: "heartbeat", script: "scripts/heartbeat.ts", process: null, logFile: "/tmp/oracle-heartbeat.log", escalationLevel: 0, restarts: 0, restartsThisHour: 0, lastRestartHour: 0, exitHistory: [], escalationTimer: null, standbyTimer: null },
  { name: "cdp-proxy", script: "cdp-server.ts", cwd: "/Users/jarkius/workspace/tools/claude-browser-proxy", process: null, logFile: "/tmp/oracle-cdp-proxy.log", escalationLevel: 0, restarts: 0, restartsThisHour: 0, lastRestartHour: 0, exitHistory: [], escalationTimer: null, standbyTimer: null },
];

// ─── Escalation Config ──────────────────────────────────────────────────────

const RESTART_DELAY_MS = 35_000; // Must be > 30s for Telegram polling timeout expiry
const L2_THRESHOLD = 3;         // restarts/hour to trigger L2
const L3_THRESHOLD = 5;         // restarts/hour to trigger L3
const L4_DELAY_MS = 15 * 60_000; // 15 min after L3 with no recovery → L4
const L5_POLL_MS = 5 * 60_000;   // standby: try every 5 min
const L5_STABILITY_MS = 60_000;  // must stay alive 60s to consider stable

let shuttingDown = false;

// ─── Log Piping ──────────────────────────────────────────────────────────────

async function pipeToLog(stream: ReadableStream<Uint8Array> | null, logFile: string, prefix: string): Promise<void> {
  if (!stream) return;
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const timestamped = text.split("\n").filter(Boolean).map(
        (line) => `[${new Date().toISOString()}] [${prefix}] ${line}\n`
      ).join("");
      await appendLine(logFile, timestamped);
      process.stdout.write(`[${prefix}] ${text}`);
    }
  } catch {
    // Stream closed
  }
}

// ─── Daemon Lifecycle ────────────────────────────────────────────────────────

function spawnDaemon(daemon: DaemonConfig): void {
  if (shuttingDown) return;

  try {
    log("info", "daemon", `Starting ${daemon.name} (L${daemon.escalationLevel})`);

    const proc = Bun.spawn(["bun", daemon.script], {
      cwd: daemon.cwd || CWD,
      stdout: "pipe",
      stderr: "pipe",
      env: process.env,
    });

    daemon.process = proc;

    pipeToLog(proc.stdout, daemon.logFile, daemon.name);
    pipeToLog(proc.stderr, daemon.logFile, `${daemon.name}:err`);

    // Watch for exit → escalation logic
    proc.exited.then((exitCode) => {
      if (shuttingDown) return;
      daemon.process = null;

      // Track exit history (last 5)
      daemon.exitHistory.push(exitCode ?? -1);
      if (daemon.exitHistory.length > 5) daemon.exitHistory.shift();

      log("warn", "daemon", `${daemon.name} exited`, { exitCode, escalation: daemon.escalationLevel, restarts: daemon.restartsThisHour });
      emitEvent("daemon:exit", "oracle-daemon", { name: daemon.name, exitCode, escalation: daemon.escalationLevel });

      handleEscalation(daemon);
    });
  } catch (e) {
    log("error", "daemon", `Failed to spawn ${daemon.name}`, { error: String(e) });
    emitEvent("daemon:spawn-error", "oracle-daemon", { name: daemon.name, error: String(e) });
  }
}

async function handleEscalation(daemon: DaemonConfig): Promise<void> {
  // Update hourly restart counter
  const currentHour = Math.floor(Date.now() / 3_600_000);
  if (currentHour !== daemon.lastRestartHour) {
    daemon.restartsThisHour = 0;
    daemon.lastRestartHour = currentHour;
  }
  daemon.restarts++;
  daemon.restartsThisHour++;

  // ─── L1: Simple restart ───────────────────────────────────────────
  if (daemon.restartsThisHour < L2_THRESHOLD) {
    daemon.escalationLevel = 1;
    log("info", "daemon", `L1: Restarting ${daemon.name} in ${RESTART_DELAY_MS / 1000}s (restart #${daemon.restarts})`);
    await emitEvent("daemon:restart", "oracle-daemon", { name: daemon.name, level: 1, restart: daemon.restarts });

    setTimeout(() => spawnDaemon(daemon), RESTART_DELAY_MS);
    return;
  }

  // ─── L2: Clear temp state + restart ───────────────────────────────
  if (daemon.restartsThisHour < L3_THRESHOLD) {
    daemon.escalationLevel = 2;
    log("warn", "daemon", `L2: Clearing temp state and restarting ${daemon.name}`);
    await emitEvent("daemon:escalation", "oracle-daemon", { name: daemon.name, level: 2, action: "clear-state-restart", restartsThisHour: daemon.restartsThisHour });

    // Clear daemon's temp log to prevent stale data
    try { await Bun.write(daemon.logFile, `[${new Date().toISOString()}] [daemon] L2 reset — log cleared\n`); } catch {}

    setTimeout(() => spawnDaemon(daemon), RESTART_DELAY_MS * 2);
    return;
  }

  // ─── L3: Notify human ────────────────────────────────────────────
  daemon.escalationLevel = 3;
  log("error", "daemon", `L3: ${daemon.name} exceeded restart budget, notifying human`);
  await emitEvent("daemon:escalation", "oracle-daemon", {
    name: daemon.name,
    level: 3,
    action: "notify-human",
    restartsThisHour: daemon.restartsThisHour,
    exitHistory: daemon.exitHistory,
  });

  await notifyTelegram(
    `🚨 Oracle Daemon — ${daemon.name} keeps crashing\n\n` +
    `Restarts this hour: ${daemon.restartsThisHour}\n` +
    `Exit codes: ${daemon.exitHistory.join(", ")}\n` +
    `Escalation: L3 — human notification\n` +
    `Auto-diagnosis in 15 min if no recovery.`
  );

  // Set timer for L4 (auto-diagnosis)
  if (daemon.escalationTimer) clearTimeout(daemon.escalationTimer);
  daemon.escalationTimer = setTimeout(() => escalateToL4(daemon), L4_DELAY_MS);
}

// ─── L4: Spawn Claude to diagnose ──────────────────────────────────────────

async function escalateToL4(daemon: DaemonConfig): Promise<void> {
  // If daemon recovered during the wait, skip
  if (daemon.process !== null) {
    log("info", "daemon", `L4 skipped — ${daemon.name} recovered`);
    daemon.escalationLevel = 0;
    daemon.restartsThisHour = 0;
    return;
  }

  daemon.escalationLevel = 4;
  log("error", "daemon", `L4: Spawning Claude to diagnose ${daemon.name}`);
  await emitEvent("daemon:escalation", "oracle-daemon", { name: daemon.name, level: 4, action: "claude-diagnosis" });

  await notifyTelegram(`🔬 Oracle Nerve L4 — auto-diagnosing ${daemon.name} with Claude...`);

  try {
    const diagPrompt = `The daemon "${daemon.name}" (script: ${daemon.script}) keeps crashing. ` +
      `It has restarted ${daemon.restartsThisHour} times this hour. ` +
      `Recent exit codes: ${daemon.exitHistory.join(", ")}. ` +
      `Check the log file at ${daemon.logFile} for errors. ` +
      `Diagnose the root cause and suggest a fix. Be concise.`;

    const proc = Bun.spawn([
      "claude", "-p", diagPrompt,
      "--output-format", "text",
      "--allowedTools", "Bash,Read,Grep,Glob",
      "--max-turns", "5",
    ], {
      cwd: CWD,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, CLAUDE_CODE_ENTRYPOINT: "cli" },
    });

    // 3 minute timeout for diagnosis
    const diagTimeout = setTimeout(() => { try { proc.kill(); } catch {} }, 3 * 60_000);

    const stdout = await new Response(proc.stdout).text();
    await proc.exited;
    clearTimeout(diagTimeout);

    const diagnosis = stdout.trim() || "(no output from Claude)";

    await emitEvent("nerve:diagnosis", "oracle-daemon", {
      name: daemon.name,
      exitCode: proc.exitCode,
      diagnosis: diagnosis.slice(0, 1000),
    });

    await notifyTelegram(
      `🔬 Diagnosis for ${daemon.name}:\n\n${diagnosis.slice(0, 3000)}`
    );

    log("info", "daemon", `L4 diagnosis complete for ${daemon.name}`, { exitCode: proc.exitCode });
  } catch (e) {
    log("error", "daemon", `L4 diagnosis failed for ${daemon.name}`, { error: String(e) });
    await emitEvent("nerve:diagnosis-failed", "oracle-daemon", { name: daemon.name, error: String(e) });
  }

  // Move to L5 regardless
  escalateToL5(daemon);
}

// ─── L5: Standby with periodic retry ────────────────────────────────────────

function escalateToL5(daemon: DaemonConfig): void {
  daemon.escalationLevel = 5;
  log("error", "daemon", `L5: ${daemon.name} entering standby mode (retry every ${L5_POLL_MS / 1000}s)`);
  emitEvent("daemon:escalation", "oracle-daemon", { name: daemon.name, level: 5, action: "standby" });
  notifyTelegram(`💤 ${daemon.name} in standby — will retry every 5 min`);

  if (daemon.standbyTimer) clearInterval(daemon.standbyTimer);

  daemon.standbyTimer = setInterval(async () => {
    if (shuttingDown || daemon.process !== null) {
      if (daemon.standbyTimer) clearInterval(daemon.standbyTimer);
      return;
    }

    log("info", "daemon", `L5: Attempting recovery of ${daemon.name}`);

    // Try to start
    spawnDaemon(daemon);

    // Check if it stays alive for stability period
    setTimeout(async () => {
      if (daemon.process !== null) {
        // It survived! Reset escalation
        log("info", "daemon", `L5: ${daemon.name} recovered! Resetting escalation.`);
        daemon.escalationLevel = 0;
        daemon.restartsThisHour = 0;
        daemon.exitHistory = [];
        if (daemon.standbyTimer) clearInterval(daemon.standbyTimer);
        daemon.standbyTimer = null;

        await emitEvent("daemon:recovered", "oracle-daemon", { name: daemon.name, fromLevel: 5 });
        await notifyTelegram(`✅ ${daemon.name} recovered from standby!`);
      }
    }, L5_STABILITY_MS);
  }, L5_POLL_MS);
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

function shutdown(): void {
  if (shuttingDown) return;
  shuttingDown = true;

  log("info", "daemon", "Oracle Daemon shutting down...");
  emitEvent("daemon:shutdown", "oracle-daemon", {});

  for (const daemon of DAEMONS) {
    if (daemon.escalationTimer) clearTimeout(daemon.escalationTimer);
    if (daemon.standbyTimer) clearInterval(daemon.standbyTimer);
    if (daemon.process) {
      log("info", "daemon", `Stopping ${daemon.name} (PID ${daemon.process.pid})`);
      try { daemon.process.kill(); } catch {}
    }
  }

  // Force kill after 5s
  setTimeout(() => {
    for (const daemon of DAEMONS) {
      if (daemon.process) { try { daemon.process.kill(9); } catch {} }
    }
    log("info", "daemon", "Oracle Daemon stopped");
    process.exit(0);
  }, 5_000);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("");
  console.log("🧠 Oracle Daemon v2.0 (Self-Healing)");

  await emitEvent("daemon:started", "oracle-daemon", { daemons: DAEMONS.map((d) => d.name) });

  // Launch Chrome with CDP debug port before starting cdp-proxy
  try {
    Bun.spawn(["open", "-na", "Google Chrome", "--args", "--remote-debugging-port=9222"], { stdout: "pipe", stderr: "pipe" });
    log("info", "daemon", "Chrome CDP launched on port 9222");
  } catch (e) {
    log("warn", "daemon", "Chrome CDP launch failed (may already be running)", { error: String(e) });
  }

  // Start all daemons
  for (const daemon of DAEMONS) {
    spawnDaemon(daemon);
  }

  // ─── 6am Daily Report Scheduler ─────────────────────────────────
  let lastReportDay = -1;
  setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDate();
    if (hour === 6 && minute === 0 && day !== lastReportDay) {
      lastReportDay = day;
      log("info", "daemon", "6am daily report triggered");
      emitEvent("report:daily", "oracle-daemon", {});
      Bun.spawn(["bun", "scripts/daily-report.ts"], { cwd: CWD, env: process.env });
    }
  }, 30_000); // Check every 30s

  // Startup banner
  setTimeout(() => {
    const lines = DAEMONS.map((d, i) => {
      const prefix = i < DAEMONS.length - 1 ? "├──" : "└──";
      const pid = d.process?.pid ?? "???";
      const status = d.process ? "✅" : "❌";
      return `${prefix} ${d.name.padEnd(18)} ${status} PID ${pid}`;
    });
    console.log(lines.join("\n"));
    console.log("");
    console.log("Escalation: L1→restart  L2→reset  L3→notify  L4→diagnose  L5→standby");
    console.log("Daily report: 6:00 AM");
    console.log("");
  }, 500);

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
