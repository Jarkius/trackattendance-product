# Handoff: Sprint 1 — Events Track Launch

**Date**: 2026-03-14 13:50

## What We Did (This Session — 3 hours)
- 6 rounds of Gemini deep market research (~75K chars)
- Extension v3.2.0 rewrite (879 lines, standalone, all 17 actions)
- CDP server built (optional bonus for reading)
- Sprint plan created and Gemini-reviewed with critical corrections
- Thai invoice template (pdfmake + PromptPay QR) extracted to source file
- All research saved to ψ/memory/learnings/ (8 files)

## Key Decisions
- **Events track FIRST** — schools postponed until cash flows
- **ONE product, TWO skins** — same backend, different landing pages
- **RLS from day one** — Gemini warned "PDPA death sentence" without it
- **PromptPay billing** — not Stripe (Thai B2B uses bank transfer + 3% WHT)
- **Sell to AV rental middlemen** — wholesale ฿2,000-2,500, they mark up
- **Bring own hardware for demos** — MacBook + scanner (no .exe AV problem)
- **Electron rewrite in Month 2-3** — not before first sale

## Sprint 1 — Week 1 (Mar 17-21)
- [ ] SQL Migration: tenants + licenses tables + RLS policies on Neon
- [ ] Auth middleware: Bearer token → license lookup (keep env var as master key)
- [ ] Heartbeat: enforce station limits, return license metadata
- [ ] Admin endpoint: POST /v1/admin/create-license (for manual billing)
- [ ] Frontend: parse license from heartbeat, toggle CLOUD_READ_ONLY

## Sprint 1 — Week 2 (Mar 24-28)
- [ ] PDF invoice generator with PromptPay QR (api/invoice-route.ts)
- [ ] PyInstaller build test (for backup, not primary distribution)
- [ ] License key input screen on kiosk startup
- [ ] Company registration process started (DBD, 7-14 days)

## Critical Files
- `api/server.ts` — auth middleware (line 216), heartbeat (line 866)
- `api/Postgres-schema.sql` — add tenants, licenses, RLS
- `api/invoice-route.ts` — Thai PDF invoice (already extracted from Gemini)
- `frontend/main.py` — heartbeat license parsing (line 1558)
- `docs/REVISED-SPRINT.md` — Gemini's corrected sprint with SQL
- `docs/STRATEGY.md` — full strategy + feasibility analysis

## Critical Warnings
- LINE Notify is DEAD (March 2025) → use LINE Messaging API when ready
- Windows Defender kills PyInstaller .exe → bring own hardware for demos
- Thai B2B needs company registration (Co., Ltd.) for invoicing
- AV companies are the sales channel (not direct to end clients)
- ฿3,500 base + ฿1,500/extra station (not flat pricing)

## Research Files (ψ/memory/learnings/)
- market-research-2026-03-14.md — Global market ($4.5B)
- thai-school-market-research-2026-03-14.md — 30K chars Thai competitors
- 2track-spinout-research-2026-03-14.md — Events vs Schools
- gemini-roadmap-profit-plan-2026-03-14.md — 12-month financial roadmap
- market-validation-deepresearch-2026-03-14.md — Validated numbers + LINE warning
- quickwins-sales-strategy-2026-03-14.md — Quick wins + AV middlemen
- revised-sprint-rls-invoicing-2026-03-14.md — RLS SQL + Thai invoicing
- plan-critical-review-2026-03-14.md — Gemini's brutal plan review
- sprint-crosscheck-2026-03-14.md — Final cross-check
- electron-rewrite-decision-2026-03-14.md — Why Electron later
- gemini-for-market-claude-for-code.md — Multi-AI strategy lesson

## Extension (separate repo)
- claude-browser-proxy v3.2.0 at ~/ghq/github.com/Soul-Brews-Studio/
- Standalone mode (no CDP needed)
- Auto-detects Google account for MQTT profile
- All 17 actions working (list_tabs, chat, get_text, get_response, etc.)
