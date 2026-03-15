#!/usr/bin/env bun
/**
 * TrackAttendance Heartbeat Daemon
 * Checks system health every 5 minutes, sends Telegram alerts on issues
 */

const INTERVAL = 5 * 60 * 1000; // 5 minutes
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "917848477";
const CLOUD_API = process.env.CLOUD_API_URL || "https://trackattendance-api-1093578683498.asia-southeast1.run.app";
const LANDING_URL = "https://trackattendance.jarkius.com";

async function notify(msg: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text: msg }),
  }).catch(() => {});
}

async function checkLandingPage(): Promise<{ok: boolean, detail: string}> {
  try {
    const res = await fetch(LANDING_URL, { signal: AbortSignal.timeout(10000) });
    return { ok: res.status === 200, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

async function checkAPI(): Promise<{ok: boolean, detail: string}> {
  try {
    const res = await fetch(CLOUD_API + "/", { signal: AbortSignal.timeout(10000) });
    return { ok: res.status < 500, detail: `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

async function checkTelegramBot(): Promise<{ok: boolean, detail: string}> {
  if (!BOT_TOKEN) return { ok: false, detail: "No token" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json() as any;
    return { ok: data.ok, detail: data.ok ? data.result.username : "Bot error" };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

async function checkGitStatus(): Promise<{ok: boolean, detail: string}> {
  try {
    const proc = Bun.spawn(["git", "status", "--porcelain"], {
      cwd: "/Users/jarkius/workspace/products/trackattendance",
      stdout: "pipe"
    });
    const output = await new Response(proc.stdout).text();
    const uncommitted = output.trim().split("\n").filter(l => l.trim()).length;
    return { ok: uncommitted < 20, detail: `${uncommitted} uncommitted changes` };
  } catch {
    return { ok: false, detail: "Git check failed" };
  }
}

let lastAlertTime = 0;

async function runHeartbeat() {
  const checks = await Promise.all([
    checkLandingPage().then(r => ({ name: "Landing Page", ...r })),
    checkAPI().then(r => ({ name: "Cloud API", ...r })),
    checkTelegramBot().then(r => ({ name: "Telegram Bot", ...r })),
    checkGitStatus().then(r => ({ name: "Git Status", ...r })),
  ]);

  const failures = checks.filter(c => !c.ok);
  const now = Date.now();

  if (failures.length > 0 && now - lastAlertTime > 30 * 60 * 1000) {
    // Alert at most every 30 minutes
    const msg = `⚠️ Heartbeat Alert\n\n${failures.map(f => `❌ ${f.name}: ${f.detail}`).join("\n")}\n\n${checks.filter(c => c.ok).map(c => `✅ ${c.name}`).join("\n")}`;
    await notify(msg);
    lastAlertTime = now;
    console.log(`⚠️ Alert sent: ${failures.length} failures`);
  } else {
    console.log(`💓 Heartbeat OK: ${checks.filter(c => c.ok).length}/${checks.length} healthy`);
  }

  // Write heartbeat status to file for session context
  const status = {
    timestamp: new Date().toISOString(),
    checks: checks.map(c => ({ name: c.name, ok: c.ok, detail: c.detail })),
    healthy: failures.length === 0,
  };
  await Bun.write(
    "/Users/jarkius/workspace/products/trackattendance/ψ/pulse/heartbeat.json",
    JSON.stringify(status, null, 2)
  );
}

console.log("💓 TrackAttendance Heartbeat started");
runHeartbeat(); // Initial check
setInterval(runHeartbeat, INTERVAL);
