#!/usr/bin/env bun
/**
 * Oracle Bot — grammY-based Telegram bot for TrackAttendance
 * Owner-only, AI-powered, PULSE-integrated
 */

import { Bot, type Context, session } from "grammy";
import { sequentialize } from "@grammyjs/runner";
import {
  emitEvent, appendLine, log,
  CWD, CHAT_HISTORY_PATH, SESSION_CONTEXT_PATH, EVENTS_PATH,
  TELEGRAM_INBOX_PATH, HEARTBEAT_PATH, RETROSPECTIVES_DIR, HANDOFFS_DIR,
  CLOUD_API, LANDING_URL, BOT_TOKEN,
} from "./lib/pulse.ts";

// ─── Config ──────────────────────────────────────────────────────────────────

const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const AI_PROVIDER = process.env.AI_PROVIDER || "openai";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const MAX_TELEGRAM_LENGTH = 4000;
const DO_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ─── Chat History ────────────────────────────────────────────────────────────

interface ChatEntry {
  timestamp: string;
  role: "user" | "assistant";
  text: string;
}

let chatHistory: ChatEntry[] = [];

async function loadChatHistory(): Promise<void> {
  try {
    const file = Bun.file(CHAT_HISTORY_PATH);
    if (!(await file.exists())) {
      chatHistory = [];
      return;
    }
    const text = await file.text();
    const lines = text.trim().split("\n").filter(Boolean);
    // Load last 20 entries
    const recent = lines.slice(-20);
    chatHistory = recent.map((line) => {
      try {
        return JSON.parse(line) as ChatEntry;
      } catch {
        return null;
      }
    }).filter(Boolean) as ChatEntry[];
  } catch {
    chatHistory = [];
  }
}

async function appendChatHistory(entry: ChatEntry): Promise<void> {
  chatHistory.push(entry);
  // Keep only last 20 in memory
  if (chatHistory.length > 20) {
    chatHistory = chatHistory.slice(-20);
  }
  try {
    const line = JSON.stringify(entry) + "\n";
    await appendLine(CHAT_HISTORY_PATH, line);
  } catch (e) {
    console.error("[CHAT] Failed to append history:", e);
  }
}

// ─── Session Context ─────────────────────────────────────────────────────────

let sessionContext = "";

async function loadSessionContext(): Promise<void> {
  try {
    const file = Bun.file(SESSION_CONTEXT_PATH);
    if (await file.exists()) {
      sessionContext = await file.text();
    }
  } catch {
    sessionContext = "";
  }
}

// Reload session context every 60 seconds
setInterval(loadSessionContext, 60_000);

// ─── Telegram Inbox (GPT → Claude shared channel) ──────────────────────────

interface InboxEntry {
  id: string;
  ts: string;
  type: "chat" | "do_result" | "note";
  user: string;
  gpt: string;
  status: "unread" | "read";
}

async function appendToInbox(userMsg: string, gptReply: string, type: InboxEntry["type"] = "chat"): Promise<void> {
  try {
    const entry: InboxEntry = {
      id: `tq_${Date.now()}`,
      ts: new Date().toISOString(),
      type,
      user: userMsg.slice(0, 500),
      gpt: gptReply.slice(0, 500),
      status: "unread",
    };
    const line = JSON.stringify(entry) + "\n";
    await appendLine(TELEGRAM_INBOX_PATH, line);
  } catch (e) {
    console.error("[INBOX] Failed to append:", e);
  }
}

async function getUnreadInbox(): Promise<InboxEntry[]> {
  try {
    const file = Bun.file(TELEGRAM_INBOX_PATH);
    if (!(await file.exists())) return [];
    const text = await file.text();
    const lines = text.trim().split("\n").filter(Boolean);
    const entries: InboxEntry[] = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as InboxEntry;
        if (entry.status === "unread") entries.push(entry);
      } catch {}
    }
    return entries;
  } catch {
    return [];
  }
}

async function markInboxRead(): Promise<number> {
  try {
    const file = Bun.file(TELEGRAM_INBOX_PATH);
    if (!(await file.exists())) return 0;
    const text = await file.text();
    const lines = text.trim().split("\n").filter(Boolean);
    let count = 0;
    const updated = lines.map((line) => {
      try {
        const entry = JSON.parse(line) as InboxEntry;
        if (entry.status === "unread") {
          entry.status = "read";
          count++;
        }
        return JSON.stringify(entry);
      } catch {
        return line;
      }
    });
    await Bun.write(TELEGRAM_INBOX_PATH, updated.join("\n") + "\n");
    return count;
  } catch {
    return 0;
  }
}

// ─── Auth Middleware ─────────────────────────────────────────────────────────

function ownerOnly(ctx: Context, next: () => Promise<void>): Promise<void> {
  const chatId = String(ctx.chat?.id || "");
  if (chatId !== OWNER_CHAT_ID) {
    console.log(`[AUTH] Rejected message from chat ${chatId}`);
    return Promise.resolve();
  }
  return next();
}

// ─── Health Checks ───────────────────────────────────────────────────────────

async function checkHealth(url: string, label: string): Promise<string> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return res.status >= 200 && res.status < 400
      ? `✅ ${label}: HTTP ${res.status}`
      : `❌ ${label}: HTTP ${res.status}`;
  } catch (e) {
    return `❌ ${label}: ${String(e).slice(0, 100)}`;
  }
}

// ─── AI Chat ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Oracle, the AI bridge agent for the TrackAttendance project. You are GPT running inside a Telegram bot that connects the human (Jarkius) with the development environment.

## Your Role
You are the INTELLIGENT MIDDLEWARE between the human and Claude Code (the CLI agent that does actual coding). You:
- Answer questions using the live context provided below (session context, recent events, system health)
- Know what Claude has been doing via session context and /do task results
- Provide project status from real data, not guesses
- When you don't know something specific, say "I don't have that in my current context" and suggest using /do to ask Claude

## Project: TrackAttendance
Offline-first attendance tracking system with QR/barcode kiosk scanning and cloud sync.

### Architecture
- **Frontend**: Python 3.11+, PyQt6 + QWebEngineView desktop kiosk app, SQLite local DB
- **API**: TypeScript, Fastify 5, PostgreSQL (Neon serverless), deployed on Google Cloud Run (asia-southeast1)
- **Landing**: trackattendance.jarkius.com (static site on Cloudflare)
- **Bot**: This Telegram bot (grammY + Bun), always-on daemon
- **PULSE**: Event system (events.jsonl), heartbeat monitor, dispatch engine

### Key URLs
- Cloud API: ${CLOUD_API}
- Landing: ${LANDING_URL}
- API routes: POST /v1/scans/batch, GET /v1/dashboard/stats, GET /v1/dashboard/export, GET /v1/dashboard/public/stats

### Data Flow
Badge scanned → JS keyboard listener → QWebChannel → Python → SQLite (pending) → batch sync → Fastify API → PostgreSQL

### Workspace
- Root: /Users/jarkius/workspace/products/trackattendance
- API code: trackattendance-api/ (its own git repo)
- Frontend code: trackattendance-frontend/ (its own git repo)
- Oracle brain: ψ/ (memory, pulse, inbox)

### Commands Available
- /do <task> — runs Claude Code CLI to execute a task (coding, file ops, git, etc.)
- /status — check landing page + API health
- /issues — fetch GitHub issues

## Bridge Behavior — You Are The Intelligent Router
- Every conversation is logged to Claude's inbox (ψ/inbox/telegram-queue.jsonl)
- Claude reads the inbox via a hook every time the human types in the terminal

### AUTO-DISPATCH RULES — When to spawn /do yourself:
When the user says something that REQUIRES Claude's action (not just a question you can answer), YOU should auto-dispatch it. Don't wait for the user to type /do — be proactive:
- "fix the bug in..." → auto /do
- "deploy..." → auto /do
- "update the code..." → auto /do
- "check the logs..." → auto /do
- "run tests..." → auto /do
- Any request that needs file editing, code changes, git operations, or system commands → auto /do

When you auto-dispatch, tell the user: "I'm sending this to Claude now. I'll send the result when it's done."

### HOW to auto-dispatch:
ONLY when the user EXPLICITLY asks you to do something that requires code/file changes, include this EXACT tag on its own line at the very end:
[AUTO-DO] <short imperative task for Claude, max 100 chars>

Example: User says "fix the button color to green"
Your response: "Sending to Claude now.\n[AUTO-DO] change button color to green in landing page HTML"

### STRICT RULES — DO NOT auto-dispatch when:
- The user is asking a question (even about code) → answer yourself
- The user is chatting, venting, or giving feedback → just respond
- The user says "check" or "status" → use live context, don't dispatch
- You are explaining something → never dispatch your own explanation
- If unsure → DO NOT dispatch. Only dispatch when user clearly says "fix", "deploy", "update", "change", "add", "remove", "create"
- NEVER dispatch your own response text as a task

### CONTEXT SHARING
- When the user tells you something Claude should know, acknowledge: "Got it, Claude will see this"
- When asked "did you tell Claude?" — yes, everything is logged
- You can see what Claude has been doing in the LIVE CONTEXT below (git commits, events, /do results)

## Rules
- Use the LIVE CONTEXT below to answer — it updates in real-time
- If asked "what did Claude do?" or "what happened?" — check the Latest /do Result, Recent Events, and Git Commits sections
- Be specific with data, not vague. Quote timestamps, statuses, results.
- Keep responses concise. No filler.
- When the user shares preferences, decisions, or context — acknowledge that Claude will receive it.`;

async function buildLiveContext(): Promise<string> {
  const parts: string[] = [];

  // 1. Session context (includes latest /do result)
  if (sessionContext) {
    parts.push("## Session Context\n" + sessionContext);
  }

  // 2. System health from heartbeat
  try {
    const hbFile = Bun.file(HEARTBEAT_PATH);
    if (await hbFile.exists()) {
      const hb = JSON.parse(await hbFile.text());
      const checks = (hb.checks || []).map((c: any) => `${c.ok ? "✅" : "❌"} ${c.name}: ${c.detail}`).join("\n");
      parts.push(`## System Health (${hb.timestamp})\n${checks}\nOverall: ${hb.healthy ? "healthy" : "UNHEALTHY"}`);
    }
  } catch {}

  // 3. Recent PULSE events (last 15)
  try {
    const evFile = Bun.file(EVENTS_PATH);
    if (await evFile.exists()) {
      const text = await evFile.text();
      const lines = text.trim().split("\n").filter(Boolean).slice(-15);
      const events = lines.map((l) => {
        try {
          const e = JSON.parse(l);
          const time = new Date(e.timestamp).toLocaleTimeString("en-GB", { hour12: false });
          const dataStr = e.data ? Object.entries(e.data).map(([k, v]) => `${k}=${typeof v === "string" ? v.slice(0, 80) : v}`).join(", ") : "";
          return `[${time}] ${e.type} (${e.agent})${dataStr ? ": " + dataStr : ""}`;
        } catch { return null; }
      }).filter(Boolean);
      if (events.length > 0) {
        parts.push("## Recent Events\n" + events.join("\n"));
      }
    }
  } catch {}

  // 4. Recent git commits (last 10 across all sub-repos)
  try {
    const gitProc = Bun.spawn(["git", "log", "--all", "--oneline", "-10", "--format=%h %s (%ar)"], {
      cwd: CWD,
      stdout: "pipe",
      stderr: "pipe",
    });
    const gitOut = await new Response(gitProc.stdout).text();
    await gitProc.exited;
    if (gitProc.exitCode === 0 && gitOut.trim()) {
      parts.push("## Recent Git Commits (root)\n" + gitOut.trim());
    }
  } catch {}

  // Also check sub-repos
  for (const sub of ["trackattendance-api", "trackattendance-frontend"]) {
    try {
      const subProc = Bun.spawn(["git", "log", "--oneline", "-5", "--format=%h %s (%ar)"], {
        cwd: `${CWD}/${sub}`,
        stdout: "pipe",
        stderr: "pipe",
      });
      const subOut = await new Response(subProc.stdout).text();
      await subProc.exited;
      if (subProc.exitCode === 0 && subOut.trim()) {
        parts.push(`## Recent Git Commits (${sub})\n` + subOut.trim());
      }
    } catch {}
  }

  // 5. Latest retrospective (from /rrr)
  try {
    const findRetro = Bun.spawn(["find", RETROSPECTIVES_DIR, "-name", "*.md", "-type", "f"], {
      stdout: "pipe", stderr: "pipe",
    });
    const retroFiles = (await new Response(findRetro.stdout).text()).trim().split("\n").filter(Boolean);
    await findRetro.exited;
    if (retroFiles.length > 0) {
      // Sort by filename (contains timestamp) and take the latest
      retroFiles.sort();
      const latestRetro = retroFiles[retroFiles.length - 1];
      const retroFile = Bun.file(latestRetro);
      if (await retroFile.exists()) {
        const retroContent = await retroFile.text();
        // Take first 1500 chars (summary + timeline, skip deep details)
        const retroSnippet = retroContent.slice(0, 1500);
        const filename = latestRetro.split("/").pop() || "";
        parts.push(`## Latest Retrospective (/rrr) — ${filename}\n${retroSnippet}${retroContent.length > 1500 ? "\n...(truncated)" : ""}`);
      }
    }
  } catch {}

  // 6. Latest handoff (from /forward)
  try {
    const findHandoff = Bun.spawn(["find", HANDOFFS_DIR, "-name", "*.md", "-type", "f"], {
      stdout: "pipe", stderr: "pipe",
    });
    const handoffFiles = (await new Response(findHandoff.stdout).text()).trim().split("\n").filter(Boolean);
    await findHandoff.exited;
    if (handoffFiles.length > 0) {
      handoffFiles.sort();
      const latestHandoff = handoffFiles[handoffFiles.length - 1];
      const handoffFile = Bun.file(latestHandoff);
      if (await handoffFile.exists()) {
        const handoffContent = await handoffFile.text();
        const handoffSnippet = handoffContent.slice(0, 1000);
        const filename = latestHandoff.split("/").pop() || "";
        parts.push(`## Latest Handoff (/forward) — ${filename}\n${handoffSnippet}${handoffContent.length > 1000 ? "\n...(truncated)" : ""}`);
      }
    }
  } catch {}

  return parts.length > 0 ? "\n\n# LIVE CONTEXT\n" + parts.join("\n\n") : "";
}

async function askOpenAI(userMessage: string): Promise<string> {
  const liveContext = await buildLiveContext();
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT + liveContext },
    ...chatHistory.slice(-10).map((e) => ({
      role: e.role as "user" | "assistant",
      content: e.text,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5.4",
      messages,
      max_completion_tokens: 1000,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as any;
  return data.choices?.[0]?.message?.content || "(empty response)";
}

async function askGemini(userMessage: string): Promise<string> {
  const liveContext = await buildLiveContext();

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT + liveContext }] },
        contents: [
          ...chatHistory.slice(-10).map((e) => ({
            role: e.role === "user" ? "user" : "model",
            parts: [{ text: e.text }],
          })),
          { role: "user", parts: [{ text: userMessage }] },
        ],
        generationConfig: { maxOutputTokens: 1000 },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "(empty response)";
}

async function askAI(message: string): Promise<string> {
  if (AI_PROVIDER === "gemini") {
    return askGemini(message);
  }
  return askOpenAI(message);
}

// ─── Truncation Helper ──────────────────────────────────────────────────────

function truncate(text: string, max = MAX_TELEGRAM_LENGTH): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 20) + "\n\n...(truncated)";
}

// ─── Session Context Updater ─────────────────────────────────────────────

async function updateSessionContextWithResult(task: string, status: string, output: string): Promise<void> {
  try {
    const file = Bun.file(SESSION_CONTEXT_PATH);
    let content = (await file.exists()) ? await file.text() : "";

    // Remove previous /do result section if present
    const marker = "## Latest /do Result";
    const markerIdx = content.indexOf(marker);
    if (markerIdx !== -1) {
      // Find the next ## heading after this one, or end of file
      const nextSection = content.indexOf("\n## ", markerIdx + marker.length);
      content = nextSection !== -1
        ? content.slice(0, markerIdx) + content.slice(nextSection + 1)
        : content.slice(0, markerIdx).trimEnd();
    }

    const resultSnippet = output.slice(0, 500).replace(/\n/g, "\n  ");
    const section = `\n\n## Latest /do Result\n- Task: ${task}\n- Status: ${status}\n- Time: ${new Date().toISOString()}\n- Result:\n  ${resultSnippet}\n`;

    content = content.trimEnd() + section;
    await Bun.write(SESSION_CONTEXT_PATH, content);

    // Refresh in-memory context immediately
    sessionContext = content;
  } catch (e) {
    console.error("[SESSION] Failed to update session context:", e);
  }
}

// ─── Bot Setup ───────────────────────────────────────────────────────────────

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN not set");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// Sequentialize by chat ID for session consistency
bot.use(sequentialize((ctx) => ctx.chat?.id?.toString()));

// Auth middleware — owner only
bot.use(ownerOnly);

// ─── Command Handlers ───────────────────────────────────────────────────────

bot.command(["start", "help"], async (ctx) => {
  try {
    await emitEvent("message_received", "oracle-bot", { command: "help" });
    await ctx.reply(
      `🧠 *Oracle Bot — TrackAttendance*\n\n` +
      `Commands:\n` +
      `/status — Check landing page + API health\n` +
      `/issues — Fetch GitHub issues\n` +
      `/do <task> — Run a Claude task\n` +
      `/inbox — View messages queued for Claude\n` +
      `/clearinbox — Mark all inbox messages as read\n` +
      `/help — Show this message\n\n` +
      `All messages are logged to Claude's inbox.\n` +
      `Claude sees them when a new session starts.`,
      { parse_mode: "Markdown" }
    );
  } catch (e) {
    console.error("[help]", e);
    try { await ctx.reply("Error showing help: " + String(e)); } catch {}
  }
});

bot.command("status", async (ctx) => {
  try {
    await emitEvent("message_received", "oracle-bot", { command: "status" });
    await ctx.replyWithChatAction("typing");

    const [landing, api] = await Promise.all([
      checkHealth(LANDING_URL, "Landing Page"),
      checkHealth(CLOUD_API + "/", "Cloud API"),
    ]);

    await ctx.reply(`📊 *System Status*\n\n${landing}\n${api}`, { parse_mode: "Markdown" });
  } catch (e) {
    console.error("[status]", e);
    try { await ctx.reply("Error checking status: " + String(e)); } catch {}
    await emitEvent("error", "oracle-bot", { command: "status", error: String(e) });
  }
});

bot.command("issues", async (ctx) => {
  try {
    await emitEvent("message_received", "oracle-bot", { command: "issues" });
    await ctx.replyWithChatAction("typing");

    const proc = Bun.spawn(["gh", "issue", "list", "--limit", "10", "--json", "number,title,state,labels"], {
      cwd: CWD,
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    await proc.exited;

    if (proc.exitCode !== 0) {
      await ctx.reply(`❌ Failed to fetch issues:\n${stderr.slice(0, 500)}`);
      return;
    }

    const issues = JSON.parse(output) as Array<{ number: number; title: string; state: string; labels: Array<{ name: string }> }>;

    if (issues.length === 0) {
      await ctx.reply("No open issues found.");
      return;
    }

    const lines = issues.map((i) => {
      const labels = i.labels.map((l) => l.name).join(", ");
      return `#${i.number} ${i.title}${labels ? ` [${labels}]` : ""}`;
    });

    await ctx.reply(`📋 *Issues (${issues.length})*\n\n${lines.join("\n")}`, { parse_mode: "Markdown" });
  } catch (e) {
    console.error("[issues]", e);
    try { await ctx.reply("Error fetching issues: " + String(e)); } catch {}
    await emitEvent("error", "oracle-bot", { command: "issues", error: String(e) });
  }
});

bot.command("do", async (ctx) => {
  const task = ctx.match?.trim();
  if (!task) {
    try { await ctx.reply("Usage: /do <task description>"); } catch {}
    return;
  }

  // Reply immediately — don't block the bot while Claude works
  await ctx.reply(`⚡ Task started: ${task.slice(0, 100)}${task.length > 100 ? "..." : ""}\n\nI'll send the result when Claude finishes.`);
  await emitEvent("do_task_started", "oracle-bot", { task });

  // Run Claude in background — bot stays responsive for other messages
  const chatId = ctx.chat?.id;
  runDoTask(task, chatId).catch((e) => {
    console.error("[do:bg]", e);
  });
});

// ─── tmux Integration (maw.js pattern) ──────────────────────────────────────

async function findClaudeTmuxPane(): Promise<string | null> {
  try {
    const proc = Bun.spawn(["tmux", "list-panes", "-a", "-F",
      "#{session_name}:#{window_index} #{pane_current_command}"], { stdout: "pipe", stderr: "pipe" });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    for (const line of output.split("\n")) {
      if (/\bclaude\b/i.test(line) && !line.includes("oracle-bot")) {
        return line.split(" ")[0];
      }
    }
  } catch {}
  return null;
}

async function sendToClaudeTmux(target: string, text: string): Promise<void> {
  if (text.length > 500 || text.includes("\n")) {
    // Buffer method for long/multiline text (from maw.js tmux.ts)
    const escaped = text.replace(/'/g, "'\\''");
    const loadProc = Bun.spawn(["bash", "-c", `printf '%s' '${escaped}' | tmux load-buffer -`], { stdout: "pipe", stderr: "pipe" });
    await loadProc.exited;
    const pasteProc = Bun.spawn(["tmux", "paste-buffer", "-t", target], { stdout: "pipe", stderr: "pipe" });
    await pasteProc.exited;
  } else {
    // Literal send — -l prevents tmux from interpreting special chars
    const sendProc = Bun.spawn(["tmux", "send-keys", "-t", target, "-l", text], { stdout: "pipe", stderr: "pipe" });
    await sendProc.exited;
  }
  // Staggered Enter — submit + fallback (from maw.js)
  const enter1 = Bun.spawn(["tmux", "send-keys", "-t", target, "Enter"], { stdout: "pipe", stderr: "pipe" });
  await enter1.exited;
  await new Promise(r => setTimeout(r, 500));
  const enter2 = Bun.spawn(["tmux", "send-keys", "-t", target, "Enter"], { stdout: "pipe", stderr: "pipe" });
  await enter2.exited;
}

async function captureClaudeOutput(target: string, lines = 40): Promise<string> {
  const proc = Bun.spawn(["tmux", "capture-pane", "-t", target, "-p", "-S", String(-lines)], { stdout: "pipe", stderr: "pipe" });
  const output = await new Response(proc.stdout).text();
  await proc.exited;
  return output.trim();
}

// ─── Telegram Reply Helper ──────────────────────────────────────────────────

async function sendTelegramReply(chatId: number | undefined, text: string): Promise<void> {
  if (!chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: truncate(text) }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (e) {
    console.error("[do:reply]", e);
  }
}

// ─── Background /do Task Runner ─────────────────────────────────────────────

async function runDoTask(task: string, chatId: number | undefined): Promise<void> {
  // Strategy 1: Try tmux injection into active Claude session
  const pane = await findClaudeTmuxPane();
  if (pane) {
    log("info", "oracle-bot", `tmux: found Claude at ${pane}, injecting task`);
    await sendTelegramReply(chatId, `🔗 Injecting into active Claude session (${pane})...`);
    await emitEvent("do_tmux_inject", "oracle-bot", { task, pane });

    await sendToClaudeTmux(pane, task);

    // Wait for Claude to process, then capture output
    await new Promise(r => setTimeout(r, 15_000));
    const output = await captureClaudeOutput(pane);
    await sendTelegramReply(chatId, `📋 Claude output:\n\n${output.slice(0, 3500)}`);
    await emitEvent("do_task_completed", "oracle-bot", { task, method: "tmux", resultLength: output.length });
    await updateSessionContextWithResult(task, "success (tmux)", output);
    await appendToInbox(task, output.slice(0, 500), "do_result");
    return;
  }

  // Strategy 2: Fall back to headless claude -p
  log("info", "oracle-bot", "No active Claude tmux session, using headless claude -p");
  try {
    const proc = Bun.spawn([
      "claude", "-p", task,
      "--output-format", "text",
      "--allowedTools", "Bash,Read,Write,Edit,Grep,Glob,Agent",
      "--max-turns", "10",
    ], {
      cwd: CWD,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, ANTHROPIC_LOG: "", CLAUDE_CODE_ENTRYPOINT: "cli" },
    });

    const timeout = setTimeout(() => { try { proc.kill(); } catch {} }, DO_TIMEOUT_MS);
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    await proc.exited;
    clearTimeout(timeout);

    if (proc.exitCode !== 0) {
      const errMsg = stderr || stdout || "Unknown error";
      await sendTelegramReply(chatId, `❌ Task failed (exit ${proc.exitCode}):\n\n${errMsg.slice(0, 3000)}`);
      await emitEvent("do_task_failed", "oracle-bot", { task, exitCode: proc.exitCode, error: errMsg.slice(0, 200) });
      await updateSessionContextWithResult(task, "failed", errMsg);
      await appendToInbox(task, `FAILED (exit ${proc.exitCode}): ${errMsg.slice(0, 400)}`, "do_result");
      return;
    }

    const result = stdout.trim() || "(no output)";
    await sendTelegramReply(chatId, `✅ Task done:\n\n${result.slice(0, 3500)}`);
    await emitEvent("do_task_completed", "oracle-bot", { task, method: "headless", resultLength: result.length });
    await updateSessionContextWithResult(task, "success", result);
    await appendToInbox(task, result.slice(0, 500), "do_result");
  } catch (e) {
    console.error("[do:bg]", e);
    await emitEvent("do_task_failed", "oracle-bot", { task, error: String(e) });
    await updateSessionContextWithResult(task, "error", String(e));
    await appendToInbox(task, `ERROR: ${String(e).slice(0, 400)}`, "do_result");
  }
}

bot.command("inbox", async (ctx) => {
  try {
    const unread = await getUnreadInbox();
    if (unread.length === 0) {
      await ctx.reply("📭 Claude's inbox is empty — no unread messages.");
      return;
    }

    const lines = unread.slice(-10).map((e) => {
      const time = new Date(e.ts).toLocaleTimeString("en-GB", { hour12: false });
      const typeIcon = e.type === "do_result" ? "⚡" : e.type === "note" ? "📝" : "💬";
      return `${typeIcon} [${time}] You: ${e.user.slice(0, 60)}${e.user.length > 60 ? "..." : ""}\n   GPT: ${e.gpt.slice(0, 80)}${e.gpt.length > 80 ? "..." : ""}`;
    });

    await ctx.reply(
      `📬 *Claude's Inbox* (${unread.length} unread)\n\n${lines.join("\n\n")}${unread.length > 10 ? `\n\n...and ${unread.length - 10} more` : ""}`,
      { parse_mode: "Markdown" }
    );
  } catch (e) {
    console.error("[inbox]", e);
    try { await ctx.reply("Error reading inbox: " + String(e)); } catch {}
  }
});

bot.command("clearinbox", async (ctx) => {
  try {
    const count = await markInboxRead();
    await ctx.reply(`✅ Marked ${count} message(s) as read in Claude's inbox.`);
  } catch (e) {
    console.error("[clearinbox]", e);
    try { await ctx.reply("Error clearing inbox: " + String(e)); } catch {}
  }
});

// ─── Free Text → AI Chat ────────────────────────────────────────────────────

bot.on("message:text", async (ctx) => {
  const userText = ctx.message.text;
  if (!userText) return;

  try {
    await emitEvent("message_received", "oracle-bot", { text: userText.slice(0, 100) });
    await ctx.replyWithChatAction("typing");

    // Typing indicator refresh
    const typingInterval = setInterval(async () => {
      try { await ctx.replyWithChatAction("typing"); } catch {}
    }, 4_000);

    // Save user message to history
    await appendChatHistory({ timestamp: new Date().toISOString(), role: "user", text: userText });

    const response = await askAI(userText);

    clearInterval(typingInterval);

    // Save assistant response to history
    await appendChatHistory({ timestamp: new Date().toISOString(), role: "assistant", text: response });

    // Check if GPT wants to auto-dispatch to Claude
    // Must be on its own line, at the end of the response, and task must be short (<150 chars)
    const autoDoMatch = response.match(/\n?\[AUTO-DO\]\s*(.{5,150})$/);
    let displayResponse = response.replace(/\n?\[AUTO-DO\]\s*.{5,150}$/, "").trim();

    await ctx.reply(truncate(displayResponse));
    await emitEvent("ai_response", "oracle-bot", { provider: AI_PROVIDER, responseLength: response.length });

    // Log to Claude's inbox — so Claude knows what was discussed
    await appendToInbox(userText, displayResponse, "chat");

    // Auto-dispatch if GPT decided Claude should act
    if (autoDoMatch) {
      const autoTask = autoDoMatch[1].trim();
      log("info", "oracle-bot", `GPT auto-dispatching /do: ${autoTask.slice(0, 80)}`);
      await ctx.reply(`⚡ Auto-dispatching to Claude: ${autoTask.slice(0, 100)}`);
      await emitEvent("do_task_started", "oracle-bot", { task: autoTask, auto: true });
      const chatId = ctx.chat?.id;
      runDoTask(autoTask, chatId).catch((e) => console.error("[auto-do]", e));
    }
  } catch (e) {
    console.error("[chat]", e);
    try { await ctx.reply("AI error: " + String(e)); } catch {}
    await emitEvent("error", "oracle-bot", { handler: "chat", error: String(e) });
  }
});

// ─── Error Handler ───────────────────────────────────────────────────────────

bot.catch((err) => {
  console.error("[BOT ERROR]", err.message);
  emitEvent("error", "oracle-bot", { error: err.message }).catch(() => {});
});

// ─── Start ───────────────────────────────────────────────────────────────────

async function main() {
  await loadChatHistory();
  await loadSessionContext();

  console.log("🤖 Oracle Bot starting...");
  console.log(`   AI Provider: ${AI_PROVIDER}`);
  console.log(`   Owner Chat ID: ${OWNER_CHAT_ID}`);
  console.log(`   Chat history: ${chatHistory.length} entries loaded`);

  console.log("🤖 Oracle Bot is running");
  await emitEvent("bot_started", "oracle-bot", { provider: AI_PROVIDER, historyEntries: chatHistory.length });

  // Graceful shutdown
  const stop = () => {
    console.log("🤖 Oracle Bot shutting down...");
    bot.stop();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  // Start polling with retry on 409 Conflict.
  // When a previous bot instance crashes, its getUpdates long-poll (30s timeout)
  // stays active on Telegram's servers. We retry with backoff > 30s.
  const MAX_START_RETRIES = 4;
  for (let attempt = 1; attempt <= MAX_START_RETRIES; attempt++) {
    try {
      console.log(`🤖 Starting polling (attempt ${attempt}/${MAX_START_RETRIES})...`);
      await bot.start({
        drop_pending_updates: false,
        onStart: () => console.log("🤖 Polling started"),
      });
      break;
    } catch (e: any) {
      if (e?.error_code === 409 && attempt < MAX_START_RETRIES) {
        // Must wait longer than the stale session's 30s long-poll timeout
        const delay = 35;
        console.log(`⚠️ 409 Conflict — waiting ${delay}s for stale session to expire (attempt ${attempt})...`);
        await new Promise((r) => setTimeout(r, delay * 1000));
        continue;
      }
      throw e;
    }
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
