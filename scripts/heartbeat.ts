#!/usr/bin/env bun
/**
 * TrackAttendance Heartbeat Daemon
 * Checks system health every 5 minutes, emits PULSE events on state transitions
 *
 * Part of Oracle Nerve — the sensor in the negative feedback loop.
 * Detects deviations from the healthy setpoint and emits error signals.
 */

import { emitEvent, notifyTelegram, CLOUD_API, LANDING_URL, BOT_TOKEN, HEARTBEAT_PATH, CWD } from "./lib/pulse.ts";

const INTERVAL = 5 * 60 * 1000; // 5 minutes
const KEEPALIVE_CYCLES = 6;     // emit heartbeat:ok every 6 cycles (30 min)

// ─── Health Checks ──────────────────────────────────────────────────────────

async function checkLandingPage(): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(LANDING_URL, { signal: AbortSignal.timeout(10_000) });
    return { ok: res.status === 200, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: String(e).slice(0, 100) };
  }
}

async function checkAPI(): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(CLOUD_API + "/", { signal: AbortSignal.timeout(10_000) });
    return { ok: res.status < 500, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: String(e).slice(0, 100) };
  }
}

async function checkTelegramBot(): Promise<{ ok: boolean; detail: string }> {
  if (!BOT_TOKEN) return { ok: false, detail: "No token" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`, { signal: AbortSignal.timeout(5_000) });
    const data = (await res.json()) as any;
    return { ok: data.ok, detail: data.ok ? data.result.username : "Bot error" };
  } catch (e) {
    return { ok: false, detail: String(e).slice(0, 100) };
  }
}

async function checkGitStatus(): Promise<{ ok: boolean; detail: string }> {
  try {
    const proc = Bun.spawn(["git", "status", "--porcelain"], { cwd: CWD, stdout: "pipe" });
    const output = await new Response(proc.stdout).text();
    const uncommitted = output.trim().split("\n").filter((l) => l.trim()).length;
    return { ok: uncommitted < 50, detail: `${uncommitted} uncommitted changes` };
  } catch {
    return { ok: false, detail: "Git check failed" };
  }
}

// ─── State Tracking (for transition detection) ─────────────────────────────

const previousState = new Map<string, boolean>();
let cycleCount = 0;
let lastAlertTime = 0;

// ─── Main Heartbeat Loop ────────────────────────────────────────────────────

async function runHeartbeat() {
  cycleCount++;

  const checks = await Promise.all([
    checkLandingPage().then((r) => ({ name: "Landing Page", ...r })),
    checkAPI().then((r) => ({ name: "Cloud API", ...r })),
    checkTelegramBot().then((r) => ({ name: "Telegram Bot", ...r })),
    checkGitStatus().then((r) => ({ name: "Git Status", ...r })),
  ]);

  const failures = checks.filter((c) => !c.ok);

  // ─── State Transition Detection + PULSE Event Emission ──────────────
  for (const check of checks) {
    const prev = previousState.get(check.name);

    if (prev === true && !check.ok) {
      // Healthy → Unhealthy (rising edge of error signal)
      console.log(`🔴 ${check.name} FAILED: ${check.detail}`);
      await emitEvent("heartbeat:fail", "heartbeat", { check: check.name, detail: check.detail });
    } else if (prev === false && check.ok) {
      // Unhealthy → Healthy (error corrected — feedback loop closed)
      console.log(`🟢 ${check.name} RECOVERED`);
      await emitEvent("heartbeat:recover", "heartbeat", { check: check.name, detail: check.detail });
    } else if (prev === undefined && !check.ok) {
      // First run and already failing
      console.log(`🔴 ${check.name} FAILED (initial): ${check.detail}`);
      await emitEvent("heartbeat:fail", "heartbeat", { check: check.name, detail: check.detail });
    }

    previousState.set(check.name, check.ok);
  }

  // Keepalive: emit heartbeat:ok every N cycles when all healthy
  if (failures.length === 0 && cycleCount % KEEPALIVE_CYCLES === 0) {
    await emitEvent("heartbeat:ok", "heartbeat", { checks: checks.length, cycle: cycleCount });
  }

  // ─── Legacy Telegram Alert (direct, with cooldown) ──────────────────
  const now = Date.now();
  if (failures.length > 0 && now - lastAlertTime > 30 * 60 * 1000) {
    const msg = `⚠️ Heartbeat Alert\n\n${failures.map((f) => `❌ ${f.name}: ${f.detail}`).join("\n")}\n\n${checks.filter((c) => c.ok).map((c) => `✅ ${c.name}`).join("\n")}`;
    await notifyTelegram(msg);
    lastAlertTime = now;
  } else {
    console.log(`💓 Heartbeat: ${checks.filter((c) => c.ok).length}/${checks.length} healthy (cycle ${cycleCount})`);
  }

  // ─── Write status file for live context ─────────────────────────────
  const status = {
    timestamp: new Date().toISOString(),
    checks: checks.map((c) => ({ name: c.name, ok: c.ok, detail: c.detail })),
    healthy: failures.length === 0,
  };
  await Bun.write(HEARTBEAT_PATH, JSON.stringify(status, null, 2));
}

// ─── Start ──────────────────────────────────────────────────────────────────

console.log("💓 Heartbeat started (with PULSE event emission)");
await emitEvent("heartbeat:started", "heartbeat", {});
runHeartbeat();
setInterval(runHeartbeat, INTERVAL);
