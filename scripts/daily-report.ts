#!/usr/bin/env bun
/**
 * Daily Report — generates and sends a system report to Telegram
 *
 * Run manually: bun scripts/daily-report.ts
 * Schedule: crontab -e → 0 6 * * * cd /Users/jarkius/workspace/products/trackattendance && bun scripts/daily-report.ts
 */

import { appendFile } from "node:fs/promises";

const CWD = "/Users/jarkius/workspace/products/trackattendance";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "917848477";
const EVENTS_PATH = `${CWD}/ψ/pulse/events.jsonl`;
const HEARTBEAT_PATH = `${CWD}/ψ/pulse/heartbeat.json`;
const INBOX_PATH = `${CWD}/ψ/inbox/telegram-queue.jsonl`;
const FIX_REQUESTS_PATH = `${CWD}/ψ/inbox/fix-requests.jsonl`;

async function readJsonl(path: string): Promise<any[]> {
  try {
    const text = await Bun.file(path).text();
    return text.trim().split("\n").filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}

async function sendTelegram(text: string): Promise<void> {
  if (!BOT_TOKEN) { console.log(text); return; }
  // Split long messages (Telegram limit ~4096 chars)
  const chunks = [];
  for (let i = 0; i < text.length; i += 4000) {
    chunks.push(text.slice(i, i + 4000));
  }
  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: chunk, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 500));
  }
}

async function generateReport(): Promise<string> {
  const now = new Date();
  const parts: string[] = [];

  parts.push(`📊 <b>Daily Report — ${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</b>`);
  parts.push(`🕐 ${now.toLocaleTimeString("en-GB", { hour12: false, timeZone: "Asia/Bangkok" })} GMT+7`);
  parts.push("");

  // 1. System Health
  try {
    const hb = JSON.parse(await Bun.file(HEARTBEAT_PATH).text());
    const checks = hb.checks.map((c: any) => `${c.ok ? "✅" : "❌"} ${c.name}: ${c.detail}`).join("\n");
    const age = Math.round((Date.now() - new Date(hb.timestamp).getTime()) / 60000);
    parts.push(`<b>System Health</b> (${age}m ago)`);
    parts.push(checks);
    parts.push("");
  } catch {
    parts.push("❌ Heartbeat unavailable");
    parts.push("");
  }

  // 2. Events Summary (last 24h)
  const events = await readJsonl(EVENTS_PATH);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recent = events.filter(e => e.timestamp > cutoff);
  const typeCounts = new Map<string, number>();
  for (const e of recent) {
    typeCounts.set(e.type, (typeCounts.get(e.type) || 0) + 1);
  }
  parts.push(`<b>Events (24h)</b> — ${recent.length} total`);
  const sorted = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  for (const [type, count] of sorted) {
    parts.push(`  ${type}: ${count}`);
  }
  parts.push("");

  // 3. Errors & Escalations
  const errors = recent.filter(e => e.type.includes("error") || e.type.includes("fail") || e.type.includes("escalation"));
  if (errors.length > 0) {
    parts.push(`<b>⚠️ Errors & Escalations</b> — ${errors.length}`);
    for (const e of errors.slice(-5)) {
      const time = e.timestamp.slice(11, 19);
      const detail = JSON.stringify(e.data).slice(0, 80);
      parts.push(`  [${time}] ${e.type}: ${detail}`);
    }
    parts.push("");
  }

  // 4. Git Activity
  try {
    const gitProc = Bun.spawn(["git", "log", "--oneline", "--since=24 hours ago", "--format=%h %s"], { cwd: CWD, stdout: "pipe" });
    const gitLog = (await new Response(gitProc.stdout).text()).trim();
    await gitProc.exited;
    const commits = gitLog.split("\n").filter(Boolean);
    parts.push(`<b>Git Activity</b> — ${commits.length} commit(s)`);
    for (const c of commits.slice(0, 5)) {
      parts.push(`  ${c}`);
    }
    if (commits.length > 5) parts.push(`  ...and ${commits.length - 5} more`);
    parts.push("");
  } catch {
    parts.push("Git: unavailable");
    parts.push("");
  }

  // 5. Telegram Inbox
  const inbox = await readJsonl(INBOX_PATH);
  const unread = inbox.filter(e => e.status === "unread");
  parts.push(`<b>Telegram Inbox</b> — ${unread.length} unread / ${inbox.length} total`);
  parts.push("");

  // 6. Fix Requests
  const fixes = await readJsonl(FIX_REQUESTS_PATH);
  const openFixes = fixes.filter(f => f.status === "open");
  if (openFixes.length > 0) {
    parts.push(`<b>🔧 Open Fix Requests</b> — ${openFixes.length}`);
    for (const f of openFixes.slice(-3)) {
      parts.push(`  ${f.agent}: ${f.error.slice(0, 60)}`);
    }
    parts.push("");
  }

  // 7. Daemon Status
  try {
    const ps = Bun.spawn(["pgrep", "-af", "oracle-bot|dispatch-engine|heartbeat|cdp-server|control-center"], { stdout: "pipe" });
    const psOut = (await new Response(ps.stdout).text()).trim();
    const running = psOut.split("\n").filter(Boolean).length;
    parts.push(`<b>Daemons</b> — ${running}/5 running`);
  } catch {
    parts.push("Daemons: check failed");
  }
  parts.push("");

  // ─── MORNING NEWSPAPER ───────────────────────────────────────────

  // 8. AI News (HN + TechCrunch + Ars — 6 articles with links)
  const aiArticles: Array<{ title: string; url: string; source: string; score?: number }> = [];

  // HN AI stories (with links)
  try {
    const hnRes = await fetch("https://hn.algolia.com/api/v1/search?query=AI+LLM+Claude+GPT+agent&tags=story&hitsPerPage=10", { signal: AbortSignal.timeout(5000) });
    const hnData = await hnRes.json() as any;
    for (const h of (hnData.hits || []).slice(0, 4)) {
      if (h.url) aiArticles.push({ title: h.title, url: h.url, source: "HN", score: h.points });
    }
  } catch {}

  // TechCrunch AI (RSS with links)
  try {
    const tcRes = await fetch("https://techcrunch.com/category/artificial-intelligence/feed/", {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Oracle/1.0" },
    });
    const tcXml = await tcRes.text();
    const tcItems = [...tcXml.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([^\]<]+)[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)];
    for (const m of tcItems.slice(0, 3)) {
      aiArticles.push({ title: m[1].trim(), url: m[2].trim(), source: "TC" });
    }
  } catch {}

  // Ars Technica AI (RSS with links)
  try {
    const arsRes = await fetch("https://feeds.arstechnica.com/arstechnica/technology-lab", {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Oracle/1.0" },
    });
    const arsXml = await arsRes.text();
    const arsItems = [...arsXml.matchAll(/<item>[\s\S]*?<title>([^<]+)<\/title>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)];
    for (const m of arsItems.slice(0, 3)) {
      const title = m[1].trim();
      if (/ai|llm|gpt|claude|agent|model|openai|anthropic|google|gemini/i.test(title)) {
        aiArticles.push({ title, url: m[2].trim(), source: "Ars" });
      }
    }
  } catch {}

  // Pick top 6, deduplicate
  const seen = new Set<string>();
  const top6 = aiArticles.filter(a => {
    const key = a.title.toLowerCase().slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);

  if (top6.length > 0) {
    parts.push(`<b>🤖 AI Morning Read</b>`);
    for (const a of top6) {
      const scoreStr = a.score ? ` (${a.score}⬆)` : "";
      parts.push(`  • <a href="${a.url}">${a.title}</a>${scoreStr}`);
    }
    parts.push("");
  }

  // 9. BBC Top Headlines (with links)
  try {
    const bbcRes = await fetch("https://feeds.bbci.co.uk/news/rss.xml", { signal: AbortSignal.timeout(5000) });
    const bbcXml = await bbcRes.text();
    const bbcItems = [...bbcXml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[([^\]]+)\]\]><\/title>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g)];
    if (bbcItems.length > 0) {
      parts.push(`<b>📰 World Headlines</b>`);
      for (const m of bbcItems.slice(0, 4)) {
        parts.push(`  • <a href="${m[2].trim()}">${m[1].trim()}</a>`);
      }
      parts.push("");
    }
  } catch {}

  parts.push("— Oracle Nerve 🧠");

  return parts.join("\n");
}

// Run
const report = await generateReport();
await sendTelegram(report);
console.log("✅ Report sent");
console.log(report.replace(/<[^>]+>/g, ""));
