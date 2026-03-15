#!/usr/bin/env bun
/**
 * TrackAttendance Telegram Bot — AI-powered with Gemini Flash
 * Run: GEMINI_API_KEY=xxx bun scripts/telegram-bot.ts
 */

// Auto-load .env (Bun supports this natively from project root)
const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API = `https://api.telegram.org/bot${TOKEN}`;
const CLOUD_API = process.env.CLOUD_API_URL || "https://trackattendance-api-1093578683498.asia-southeast1.run.app";
const CLOUD_KEY = process.env.CLOUD_API_KEY || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const AI_PROVIDER = process.env.AI_PROVIDER || (OPENAI_KEY ? "openai" : "gemini");

let offset = 0;

// Load live session context so GPT knows what Claude is doing
async function loadSessionContext(): Promise<string> {
  try {
    const ctx = await Bun.file("/Users/jarkius/workspace/products/trackattendance/ψ/inbox/session-context.md").text();
    return ctx;
  } catch {
    return "No session context available.";
  }
}

let SYSTEM_PROMPT = `You are the TrackAttendance Oracle Bot — Jarkius's AI assistant running on his MacBook.

IMPORTANT: You are ONE part of a system. Claude Code (Opus) is the main worker. You (GPT-5.4) handle quick questions on Telegram. When the user says /do, Claude Code executes the task on the Mac.

You help Jarkius (the founder) with:
- Product strategy and roadmap questions
- Competitor analysis (CodeREADr, EventMobi, Clockify, Jibble, Deputy, Envoy, BambooHR, Stripe, Linear, Vercel for design)
- Technical questions about the stack (Fastify API, PyQt6 frontend, SQLite + PostgreSQL)
- Sales and marketing guidance for Thai B2B market
- Sprint planning (12 open GitHub issues across 7 sprints)

Key product facts:
- Pricing: Starter 3,500 THB/event (3 stations), Professional 6,500 THB (5 stations), Enterprise custom
- Differentiators: Offline-first, multi-station sync, 0.3s scan speed, per-station pricing
- Stack: Python/PyQt6 kiosk -> SQLite -> batch sync -> Fastify/TypeScript API -> PostgreSQL (Neon)
- Landing page: LIVE at https://trackattendance.jarkius.com (Cloudflare Pages)
- Market gap: No strong mid-market option at $20-100/month with offline + multi-site + badge scanning

When the user asks you to DO something (build, fix, deploy, check):
- Tell them to use /do prefix so Claude Code executes it
- Example: "Use /do check contrast issues — Claude will run it on your Mac"
- You can answer questions, but you cannot execute code or modify files

Top competitor landing pages for reference:
- stripe.com (light theme gold standard)
- linear.app (best dark mode)
- vercel.com (minimalist)
- lemonsqueezy.com (playful purple)
- deputy.com, jibble.io, clockify.me, bamboohr.com, wheniwork.com (HR/attendance)

Keep responses concise (under 200 words). Use Thai when the user writes in Thai. Do NOT use HTML tags - use plain text with emoji for formatting.`;

const chatHistory: Map<number, Array<{role: string, content: string}>> = new Map();

// Refresh system prompt with live context every 5 minutes
async function refreshSystemPrompt() {
  const ctx = await loadSessionContext();
  SYSTEM_PROMPT = SYSTEM_PROMPT.split("\n--- LIVE SESSION CONTEXT ---")[0] +
    "\n--- LIVE SESSION CONTEXT ---\n" + ctx;
  console.log("🔄 System prompt refreshed with session context");
}
setInterval(refreshSystemPrompt, 5 * 60 * 1000);
refreshSystemPrompt(); // Initial load

async function send(chatId: number, text: string) {
  try {
    const res = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = await res.json() as any;
    if (!data.ok) {
      console.error("Telegram send error:", data.description);
      // Retry without parse_mode if HTML was the issue
    }
  } catch (e) {
    console.error("Send error:", e);
  }
}

async function askGemini(history: Array<{role: string, content: string}>): Promise<string> {
  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Understood. I am the TrackAttendance Oracle Bot." }] },
    ...history.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 1000, temperature: 0.7 } }),
      signal: AbortSignal.timeout(30000),
    }
  );
  const data = await res.json() as any;
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
}

async function askOpenAI(history: Array<{role: string, content: string}>): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-5.4",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
      max_completion_tokens: 1000,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json() as any;
  if (data.error) throw new Error(data.error.message);
  return data.choices?.[0]?.message?.content || "No response";
}

async function askAI(chatId: number, userMessage: string): Promise<string> {
  const history = chatHistory.get(chatId) || [];
  history.push({ role: "user", content: userMessage });
  if (history.length > 20) history.splice(0, history.length - 20);
  chatHistory.set(chatId, history);

  try {
    let reply: string;
    if (AI_PROVIDER === "openai" && OPENAI_KEY) {
      reply = await askOpenAI(history);
    } else if (GEMINI_KEY) {
      reply = await askGemini(history);
    } else {
      return "No AI configured. Set GEMINI_API_KEY or OPENAI_API_KEY.";
    }
    history.push({ role: "assistant", content: reply });
    console.log(`🤖 [${AI_PROVIDER}] Reply: ${reply.substring(0, 80)}...`);
    return reply;
  } catch (e) {
    console.error(`${AI_PROVIDER} error:`, e);
    return `AI error: ${e}`;
  }
}

async function handleMessage(chatId: number, text: string) {
  const cmd = text.trim().toLowerCase();
  const lower = cmd;

  // Slash commands — direct handlers (no AI needed)
  if (cmd === "/start" || cmd === "/help") {
    await send(chatId, "🤖 TrackAttendance Oracle Bot\n\nI'm an AI-powered bot. Just talk to me naturally!\n\nSlash commands:\n/status — API health\n/issues — GitHub issues\n/help — This message\n\nOr ask me anything:\n• \"What should I build first?\"\n• \"ขอดูคู่แข่ง\"\n• \"Show me the roadmap\"");
    return;
  }

  if (cmd === "/status") {
    try {
      const res = await fetch(`${CLOUD_API}/`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json().catch(() => ({})) as any;
        await send(chatId, `🟢 API Online\nServer: ${data.server || "trackattendance-api"}\nVersion: ${data.version || "?"}\nRegion: asia-southeast1`);
      } else {
        await send(chatId, `🟡 API responded with ${res.status}. May not be deployed yet.`);
      }
    } catch (e) {
      await send(chatId, `🔴 API Offline\n${String(e).substring(0, 200)}`);
    }
    return;
  }

  if (cmd === "/issues") {
    try {
      const res = await fetch("https://api.github.com/repos/Jarkius/trackattendance-product/issues?state=open&per_page=12", {
        signal: AbortSignal.timeout(5000),
      });
      const issues = await res.json() as any[];
      const lines = issues.map((i: any) => {
        const labels = i.labels?.map((l: any) => l.name).join(", ") || "";
        const tag = labels.includes("in-progress") ? "🟡" : "⏳";
        return `${tag} #${i.number} ${i.title}`;
      });
      await send(chatId, `📋 Open Issues\n\n${lines.join("\n")}\n\n🔗 github.com/Jarkius/trackattendance-product/issues`);
    } catch {
      await send(chatId, "❌ Failed to fetch issues");
    }
    return;
  }

  // /do — Spawn Claude CLI to execute tasks (works remotely from phone!)
  if (lower.startsWith("/do ")) {
    const task = text.replace(/^\/do\s+/i, "").trim();
    if (!task) { await send(chatId, "Usage: /do <task description>"); return; }

    await send(chatId, `🧠 Oracle received. Executing now...\n\n"${task}"`);
    console.log(`🚀 Spawning Claude for: ${task}`);

    try {
      const cwd = "/Users/jarkius/workspace/products/trackattendance";
      const proc = Bun.spawn(
        ["claude", "-p", task, "--output-format", "text"],
        { cwd, stdout: "pipe", stderr: "pipe", timeout: 300_000 }
      );

      const output = await new Response(proc.stdout).text();
      const exitCode = await proc.exited;

      if (exitCode === 0 && output.trim()) {
        // Telegram max message is 4096 chars
        const reply = output.length > 3500
          ? output.substring(0, 3500) + "\n\n... (truncated)"
          : output;
        await send(chatId, `✅ Oracle completed:\n\n${reply}`);
      } else {
        const stderr = await new Response(proc.stderr).text();
        await send(chatId, `❌ Oracle failed (exit ${exitCode}):\n${stderr.substring(0, 1000) || "No output"}`);
      }
    } catch (e) {
      await send(chatId, `❌ Oracle error: ${e}`);
    }
    console.log(`✅ Claude task done: ${task.substring(0, 50)}`);
    return;
  }

  // Everything else → AI
  console.log(`🧠 Asking ${AI_PROVIDER}: "${text.substring(0, 60)}..."`);
  const reply = await askAI(chatId, text);
  await send(chatId, reply);
}

async function poll() {
  console.log(`🤖 TrackAttendance Bot started (AI: ${AI_PROVIDER} ${AI_PROVIDER === "openai" ? (OPENAI_KEY ? "✅" : "❌") : (GEMINI_KEY ? "✅" : "❌")})`);

  while (true) {
    try {
      const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=30`, {
        signal: AbortSignal.timeout(35000),
      });
      const data = await res.json() as any;

      for (const update of data.result || []) {
        offset = update.update_id + 1;
        const msg = update.message;
        if (!msg?.text) continue;

        console.log(`📩 ${msg.from.first_name}: ${msg.text}`);
        await handleMessage(msg.chat.id, msg.text);
      }
    } catch (e) {
      console.error("Poll error:", e);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

poll();
