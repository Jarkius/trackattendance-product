#!/usr/bin/env bun
/**
 * Oracle Control Center — simple service dashboard
 * Absorbed from maw.js pattern: Hono + Bun.serve
 *
 * http://localhost:3457 (or http://<hostname>.local:3457)
 */

import { Hono } from "hono";
import { CWD, EVENTS_PATH, HEARTBEAT_PATH, SESSION_CONTEXT_PATH, TELEGRAM_INBOX_PATH, FIX_REQUESTS_PATH } from "./lib/pulse.ts";

const PORT = Number(process.env.CONTROL_PORT) || 3457;

const app = new Hono();

// ─── API Routes ─────────────────────────────────────────────────────────────

app.get("/api/status", async (c) => {
  // Check each daemon process
  const daemons = ["oracle-bot", "dispatch-engine", "heartbeat", "cdp-server"];
  const statuses: Record<string, any> = {};

  for (const name of daemons) {
    try {
      const proc = Bun.spawn(["pgrep", "-f", name], { stdout: "pipe" });
      const out = await new Response(proc.stdout).text();
      await proc.exited;
      const pids = out.trim().split("\n").filter(Boolean);
      statuses[name] = { running: pids.length > 0, pids };
    } catch {
      statuses[name] = { running: false, pids: [] };
    }
  }

  // Heartbeat data
  let heartbeat = null;
  try { heartbeat = JSON.parse(await Bun.file(HEARTBEAT_PATH).text()); } catch {}

  // Events count
  let eventCount = 0;
  try {
    const text = await Bun.file(EVENTS_PATH).text();
    eventCount = text.trim().split("\n").filter(Boolean).length;
  } catch {}

  // Inbox unread
  let inboxUnread = 0;
  try {
    const text = await Bun.file(TELEGRAM_INBOX_PATH).text();
    inboxUnread = text.split("\n").filter(l => l.includes('"unread"')).length;
  } catch {}

  // Fix requests
  let fixOpen = 0;
  try {
    const text = await Bun.file(FIX_REQUESTS_PATH).text();
    fixOpen = text.split("\n").filter(l => l.includes('"open"')).length;
  } catch {}

  // tmux sessions
  let tmuxSessions: string[] = [];
  try {
    const proc = Bun.spawn(["tmux", "list-sessions", "-F", "#{session_name}: #{session_windows} windows"], { stdout: "pipe" });
    const out = await new Response(proc.stdout).text();
    await proc.exited;
    tmuxSessions = out.trim().split("\n").filter(Boolean);
  } catch {}

  return c.json({
    timestamp: new Date().toISOString(),
    daemons: statuses,
    heartbeat,
    events: eventCount,
    inbox: { unread: inboxUnread },
    fixRequests: { open: fixOpen },
    tmux: tmuxSessions,
  });
});

app.get("/api/logs/:daemon", async (c) => {
  const daemon = c.req.param("daemon");
  const logFile = `/tmp/oracle-${daemon}.log`;
  try {
    const text = await Bun.file(logFile).text();
    const lines = text.trim().split("\n").slice(-50);
    return c.json({ daemon, lines });
  } catch {
    return c.json({ daemon, lines: ["(no log file)"] });
  }
});

app.get("/api/events", async (c) => {
  try {
    const text = await Bun.file(EVENTS_PATH).text();
    const lines = text.trim().split("\n").filter(Boolean).slice(-30);
    const events = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    return c.json(events);
  } catch {
    return c.json([]);
  }
});

// Kill orphan processes (stale claude -p, duplicate bots, etc.)
app.post("/api/kill-orphans", async (c) => {
  const killed: string[] = [];
  // Kill stale claude -p processes
  try {
    const proc = Bun.spawn(["bash", "-c", "pgrep -f 'claude.*-p' | grep -v $PPID"], { stdout: "pipe" });
    const pids = (await new Response(proc.stdout).text()).trim().split("\n").filter(Boolean);
    for (const pid of pids) {
      try { process.kill(Number(pid), 9); killed.push(`claude-p:${pid}`); } catch {}
    }
  } catch {}
  // Kill duplicate ccbot
  try {
    const proc = Bun.spawn(["pgrep", "-f", "ccbot"], { stdout: "pipe" });
    const pids = (await new Response(proc.stdout).text()).trim().split("\n").filter(Boolean);
    for (const pid of pids) {
      try { process.kill(Number(pid), 9); killed.push(`ccbot:${pid}`); } catch {}
    }
  } catch {}
  return c.json({ killed });
});

// Restart a specific daemon (kills + oracle-daemon will auto-restart it)
app.post("/api/restart/:daemon", async (c) => {
  const daemon = c.req.param("daemon");
  try {
    const proc = Bun.spawn(["pkill", "-f", daemon], { stdout: "pipe" });
    await proc.exited;
    return c.json({ restarted: daemon, note: "oracle-daemon will auto-restart it" });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
});

app.get("/api/report", async (c) => {
  try {
    const proc = Bun.spawn(["bun", "scripts/daily-report.ts"], { cwd: CWD, stdout: "pipe", env: process.env });
    await proc.exited;
    return c.json({ sent: true });
  } catch (e) {
    return c.json({ sent: false, error: String(e) });
  }
});

// ─── Dashboard HTML ─────────────────────────────────────────────────────────

app.get("/", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Oracle Control Center</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'SF Mono', 'Menlo', monospace; background: #0a0a0a; color: #e0e0e0; padding: 20px; }
    h1 { font-size: 18px; color: #00ff88; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
    .card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 16px; }
    .card h2 { font-size: 13px; color: #888; text-transform: uppercase; margin-bottom: 12px; }
    .service { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #222; }
    .service:last-child { border-bottom: none; }
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px; }
    .dot.on { background: #00ff88; }
    .dot.off { background: #ff4444; }
    .name { font-size: 13px; }
    .pids { font-size: 11px; color: #666; }
    .stat { font-size: 24px; font-weight: bold; color: #00ff88; }
    .stat.warn { color: #ffaa00; }
    .stat.bad { color: #ff4444; }
    .label { font-size: 11px; color: #666; margin-top: 4px; }
    .health { display: flex; gap: 8px; flex-wrap: wrap; }
    .check { font-size: 12px; padding: 4px 8px; border-radius: 4px; background: #1e3a1e; color: #00ff88; }
    .check.fail { background: #3a1e1e; color: #ff4444; }
    .tmux { font-size: 12px; color: #aaa; padding: 4px 0; }
    .events { font-size: 11px; color: #aaa; max-height: 200px; overflow-y: auto; }
    .events div { padding: 2px 0; border-bottom: 1px solid #1a1a1a; }
    .btn { background: #333; color: #ddd; border: 1px solid #555; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-family: inherit; }
    .btn:hover { background: #444; }
    .time { font-size: 11px; color: #555; }
    #updated { font-size: 11px; color: #444; margin-top: 16px; }
  </style>
</head>
<body>
  <h1>🧠 Oracle Control Center</h1>
  <div class="grid">
    <div class="card">
      <h2>Services</h2>
      <div id="services">Loading...</div>
    </div>
    <div class="card">
      <h2>Health Checks</h2>
      <div id="health" class="health">Loading...</div>
    </div>
    <div class="card">
      <h2>Stats</h2>
      <div style="display:flex;gap:24px;">
        <div><div id="events" class="stat">-</div><div class="label">Events</div></div>
        <div><div id="inbox" class="stat">-</div><div class="label">Inbox</div></div>
        <div><div id="fixes" class="stat">-</div><div class="label">Fix Requests</div></div>
      </div>
    </div>
    <div class="card">
      <h2>tmux Sessions</h2>
      <div id="tmux">Loading...</div>
    </div>
    <div class="card" style="grid-column: span 2;">
      <h2>Recent Events <button class="btn" onclick="refresh()" style="float:right;">Refresh</button></h2>
      <div id="eventlog" class="events">Loading...</div>
    </div>
    <div class="card">
      <h2>Actions</h2>
      <button class="btn" onclick="sendReport()">📊 Send Report</button>
      <button class="btn" onclick="killOrphans()" style="background:#3a1a1a;border-color:#633;">🧹 Kill Orphans</button>
      <button class="btn" onclick="restartDaemon('oracle-bot')">🔄 Restart Bot</button>
      <button class="btn" onclick="restartDaemon('dispatch-engine')">🔄 Restart Dispatch</button>
      <button class="btn" onclick="restartDaemon('heartbeat')">🔄 Restart Heartbeat</button>
    </div>
  </div>
  <div id="updated"></div>

  <script>
    async function refresh() {
      try {
        const [status, events] = await Promise.all([
          fetch('/api/status').then(r => r.json()),
          fetch('/api/events').then(r => r.json()),
        ]);

        // Services
        const svc = Object.entries(status.daemons).map(([name, d]) =>
          '<div class="service"><span><span class="dot ' + (d.running ? 'on' : 'off') + '"></span><span class="name">' + name + '</span></span><span class="pids">' + (d.running ? 'PID ' + d.pids.join(',') : 'stopped') + '</span></div>'
        ).join('');
        document.getElementById('services').innerHTML = svc;

        // Health
        if (status.heartbeat?.checks) {
          document.getElementById('health').innerHTML = status.heartbeat.checks.map(c =>
            '<span class="check ' + (c.ok ? '' : 'fail') + '">' + (c.ok ? '✅' : '❌') + ' ' + c.name + '</span>'
          ).join('');
        }

        // Stats
        document.getElementById('events').textContent = status.events;
        const ib = document.getElementById('inbox');
        ib.textContent = status.inbox.unread;
        ib.className = 'stat' + (status.inbox.unread > 10 ? ' warn' : '');
        const fx = document.getElementById('fixes');
        fx.textContent = status.fixRequests.open;
        fx.className = 'stat' + (status.fixRequests.open > 0 ? ' bad' : '');

        // tmux
        document.getElementById('tmux').innerHTML = status.tmux.map(s => '<div class="tmux">' + s + '</div>').join('') || 'No sessions';

        // Events
        document.getElementById('eventlog').innerHTML = events.reverse().map(e => {
          const t = e.timestamp?.slice(11,19) || '';
          return '<div><span class="time">' + t + '</span> ' + e.type + ' <span class="pids">' + (e.agent || '') + '</span></div>';
        }).join('');

        document.getElementById('updated').textContent = 'Updated: ' + new Date().toLocaleTimeString();
      } catch(e) {
        document.getElementById('services').textContent = 'Error: ' + e.message;
      }
    }

    async function sendReport() {
      const r = await fetch('/api/report');
      const d = await r.json();
      alert(d.sent ? 'Report sent!' : 'Failed: ' + d.error);
    }
    async function killOrphans() {
      const r = await fetch('/api/kill-orphans', {method:'POST'});
      const d = await r.json();
      alert('Killed: ' + (d.killed.length > 0 ? d.killed.join(', ') : 'none found'));
      refresh();
    }
    async function restartDaemon(name) {
      if (!confirm('Restart ' + name + '?')) return;
      const r = await fetch('/api/restart/' + name, {method:'POST'});
      const d = await r.json();
      alert(d.restarted ? name + ' restarting...' : 'Error: ' + d.error);
      setTimeout(refresh, 3000);
    }

    refresh();
    setInterval(refresh, 5000);
  </script>
</body>
</html>`);
});

// ─── Start ──────────────────────────────────────────────────────────────────

export default {
  port: PORT,
  fetch: app.fetch,
};

console.log(`🖥️  Oracle Control Center running at http://localhost:${PORT}`);
