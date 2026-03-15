#!/usr/bin/env bun
/**
 * Oracle Bot — grammY-based Telegram bot for TrackAttendance
 * Owner-only, AI-powered, PULSE-integrated
 */

import { Bot, type Context, session } from "grammy";
import { run, sequentialize } from "@grammyjs/runner";

// ─── Config ──────────────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const AI_PROVIDER = process.env.AI_PROVIDER || "openai";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const CWD = "/Users/jarkius/workspace/products/trackattendance";
const CHAT_HISTORY_PATH = `${CWD}/ψ/pulse/chat-history.jsonl`;
const SESSION_CONTEXT_PATH = `${CWD}/ψ/inbox/session-context.md`;
const EVENTS_PATH = `${CWD}/ψ/pulse/events.jsonl`;

const CLOUD_API = process.env.CLOUD_API_URL || "https://trackattendance-api-1093578683498.asia-southeast1.run.app";
const LANDING_URL = "https://trackattendance.jarkius.com";

const MAX_TELEGRAM_LENGTH = 4000;
const DO_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ─── PULSE Event Emission ────────────────────────────────────────────────────

interface PulseEvent {
  timestamp: string;
  type: string;
  agent: string;
  data: Record<string, unknown>;
}

async function emitEvent(type: string, agent: string, data: Record<string, unknown> = {}): Promise<void> {
  const event: PulseEvent = {
    timestamp: new Date().toISOString(),
    type,
    agent,
    data,
  };
  try {
    const line = JSON.stringify(event) + "\n";
    await Bun.write(EVENTS_PATH, line, { append: true });
  } catch (e) {
    console.error("[PULSE] Failed to emit event:", e);
  }
}

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
    await Bun.write(CHAT_HISTORY_PATH, line, { append: true });
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

const SYSTEM_PROMPT = `You are Oracle, the AI assistant for the TrackAttendance project — an offline-first attendance tracking system with QR/barcode kiosk scanning and cloud sync.

Project overview:
- Frontend: Python/PyQt6 desktop kiosk app with SQLite
- API: TypeScript/Fastify on Google Cloud Run with PostgreSQL (Neon)
- Landing page: trackattendance.jarkius.com
- Owner: Jarkius

You help with project status, technical questions, planning, and task coordination.
Keep responses concise and actionable.`;

async function askOpenAI(userMessage: string): Promise<string> {
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT + (sessionContext ? `\n\nCurrent session context:\n${sessionContext}` : "") },
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
  const contextParts = [
    SYSTEM_PROMPT,
    sessionContext ? `\nCurrent session context:\n${sessionContext}` : "",
    ...chatHistory.slice(-10).map((e) => `${e.role}: ${e.text}`),
  ].filter(Boolean);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT + (sessionContext ? `\n\nCurrent session context:\n${sessionContext}` : "") }] },
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
      `/help — Show this message\n\n` +
      `Or just send a message to chat with AI.`,
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

  try {
    await emitEvent("do_task_started", "oracle-bot", { task });
    await ctx.replyWithChatAction("typing");

    const proc = Bun.spawn(["claude", "-p", task, "--output-format", "text"], {
      cwd: CWD,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, ANTHROPIC_LOG: "" },
    });

    // Typing indicator refresh (every 4 seconds while running)
    const typingInterval = setInterval(async () => {
      try { await ctx.replyWithChatAction("typing"); } catch {}
    }, 4_000);

    // Timeout handling
    const timeout = setTimeout(() => {
      try { proc.kill(); } catch {}
    }, DO_TIMEOUT_MS);

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    await proc.exited;

    clearInterval(typingInterval);
    clearTimeout(timeout);

    if (proc.exitCode !== 0) {
      const errMsg = stderr || stdout || "Unknown error";
      await ctx.reply(`❌ Task failed (exit ${proc.exitCode}):\n\n${truncate(errMsg)}`);
      await emitEvent("do_task_failed", "oracle-bot", { task, exitCode: proc.exitCode, error: errMsg.slice(0, 200) });
      return;
    }

    const result = stdout.trim() || "(no output)";
    await ctx.reply(truncate(result));
    await emitEvent("do_task_completed", "oracle-bot", { task, resultLength: result.length });
  } catch (e) {
    console.error("[do]", e);
    try { await ctx.reply("Error running task: " + String(e)); } catch {}
    await emitEvent("do_task_failed", "oracle-bot", { task, error: String(e) });
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

    await ctx.reply(truncate(response));
    await emitEvent("ai_response", "oracle-bot", { provider: AI_PROVIDER, responseLength: response.length });
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

  // Use grammY runner for resilient polling
  const runner = run(bot);

  console.log("🤖 Oracle Bot is running");
  await emitEvent("bot_started", "oracle-bot", { provider: AI_PROVIDER, historyEntries: chatHistory.length });

  // Graceful shutdown
  const stop = () => {
    console.log("🤖 Oracle Bot shutting down...");
    runner.isRunning() && runner.stop();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
