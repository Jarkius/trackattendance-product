# Right Mind for the Task: Gemini for Market, Claude for Code

**Date**: 2026-03-14
**Context**: TrackAttendance commercialization planning — 6 rounds of Gemini research
**Confidence**: High

## Key Learning

When building a product for a specific market (Thai B2B in this case), use the AI that knows the market best for strategy, and the AI that knows the code best for implementation. In this session, Gemini caught critical Thai-specific issues that Claude missed entirely:

1. **LINE Notify is dead** (March 2025) — must use LINE Messaging API
2. **Thai B2B uses PromptPay + PDF invoices** — Stripe is wrong for this market
3. **Withholding Tax 3%** (หัก ณ ที่จ่าย) — requires registered company (Co., Ltd.)
4. **Sell to AV rental middlemen** — they become your external sales team
5. **฿3,500 = petty cash threshold** — no board approval needed

Meanwhile, Claude excels at: reading/modifying the codebase, writing the extension (879 lines), designing RLS architecture, building sprint plans from the research, and parallel agent execution.

## The Pattern

```
1. Send research prompt to Gemini (via MQTT → extension → Gemini tab)
2. Grab Gemini's response via CDP or extension (get_response action)
3. Claude analyzes and integrates findings into codebase/docs
4. Repeat with follow-up questions
```

## Why This Matters

A solo developer building a product for a foreign market needs both breadth (market knowledge) and depth (code execution). No single AI has both. The Oracle philosophy of "right mind for the task" applies: Gemini is Morpheus (external intel), Claude is Neo (developer). Together they cover the full spectrum.

## Tags

`gemini`, `market-research`, `thai-b2b`, `oracle-philosophy`, `multi-ai`
