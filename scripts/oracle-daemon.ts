#!/usr/bin/env bun
/**
 * Oracle Daemon — Supervisor that starts and manages all daemon processes
 * Restarts crashed daemons with backoff, handles graceful shutdown
 */

const CWD = "/Users/jarkius/workspace/products/trackattendance";

// ─── Daemon Registry ─────────────────────────────────────────────────────────

interface DaemonConfig {
  name: string;
  script: string;
  restarts: number;
  restartsThisHour: number;
  lastRestartHour: number;
  process: ReturnType<typeof Bun.spawn> | null;
  logFile: string;
}

const DAEMONS: DaemonConfig[] = [
  { name: "oracle-bot", script: "scripts/oracle-bot.ts", restarts: 0, restartsThisHour: 0, lastRestartHour: 0, process: null, logFile: "/tmp/oracle-oracle-bot.log" },
  { name: "dispatch-engine", script: "scripts/dispatch-engine.ts", restarts: 0, restartsThisHour: 0, lastRestartHour: 0, process: null, logFile: "/tmp/oracle-dispatch-engine.log" },
  { name: "heartbeat", script: "scripts/heartbeat.ts", restarts: 0, restartsThisHour: 0, lastRestartHour: 0, process: null, logFile: "/tmp/oracle-heartbeat.log" },
];

const MAX_RESTARTS_PER_HOUR = 3;
const RESTART_DELAY_MS = 3_000;

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
      await Bun.write(logFile, timestamped, { append: true });
      // Also print to daemon stdout for debugging
      process.stdout.write(`[${prefix}] ${text}`);
    }
  } catch {
    // Stream closed
  }
}

// ─── Daemon Lifecycle ────────────────────────────────────────────────────────

function spawnDaemon(daemon: DaemonConfig): void {
  try {
    const proc = Bun.spawn(["bun", daemon.script], {
      cwd: CWD,
      stdout: "pipe",
      stderr: "pipe",
      env: process.env,
    });

    daemon.process = proc;

    // Pipe stdout and stderr to log files
    pipeToLog(proc.stdout, daemon.logFile, daemon.name);
    pipeToLog(proc.stderr, daemon.logFile, `${daemon.name}:err`);

    // Watch for exit
    proc.exited.then((exitCode) => {
      if (shuttingDown) return;

      console.log(`[DAEMON] ${daemon.name} exited with code ${exitCode}`);
      daemon.process = null;

      // Check restart budget
      const currentHour = Math.floor(Date.now() / 3_600_000);
      if (currentHour !== daemon.lastRestartHour) {
        daemon.restartsThisHour = 0;
        daemon.lastRestartHour = currentHour;
      }

      if (daemon.restartsThisHour >= MAX_RESTARTS_PER_HOUR) {
        console.error(`[DAEMON] ${daemon.name} exceeded ${MAX_RESTARTS_PER_HOUR} restarts this hour, giving up`);
        return;
      }

      daemon.restarts++;
      daemon.restartsThisHour++;

      console.log(`[DAEMON] Restarting ${daemon.name} in ${RESTART_DELAY_MS / 1000}s (restart #${daemon.restarts})`);
      setTimeout(() => {
        if (!shuttingDown) {
          spawnDaemon(daemon);
        }
      }, RESTART_DELAY_MS);
    });
  } catch (e) {
    console.error(`[DAEMON] Failed to spawn ${daemon.name}:`, e);
  }
}

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

function shutdown(): void {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("\n🧠 Oracle Daemon shutting down...");

  for (const daemon of DAEMONS) {
    if (daemon.process) {
      console.log(`   Stopping ${daemon.name} (PID ${daemon.process.pid})...`);
      try {
        daemon.process.kill();
      } catch {}
    }
  }

  // Give daemons 5 seconds to exit, then force kill
  setTimeout(() => {
    for (const daemon of DAEMONS) {
      if (daemon.process) {
        try {
          daemon.process.kill(9);
        } catch {}
      }
    }
    console.log("🧠 Oracle Daemon stopped");
    process.exit(0);
  }, 5_000);
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  console.log("");
  console.log("🧠 Oracle Daemon v1.0");

  // Start all daemons
  for (const daemon of DAEMONS) {
    spawnDaemon(daemon);
  }

  // Print startup banner after a short delay to let spawns settle
  setTimeout(() => {
    const lines = DAEMONS.map((d, i) => {
      const prefix = i < DAEMONS.length - 1 ? "├──" : "└──";
      const pid = d.process?.pid ?? "???";
      const status = d.process ? "✅" : "❌";
      return `${prefix} ${d.name.padEnd(18)} ${status} PID ${pid}`;
    });

    console.log(lines.join("\n"));
    console.log("");
  }, 500);

  // Signal handlers
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
