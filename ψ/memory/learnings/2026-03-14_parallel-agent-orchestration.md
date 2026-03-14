# Parallel Agent Orchestration: Power and Limits

**Date**: 2026-03-14
**Context**: TrackAttendance session with 12 parallel agents
**Confidence**: High

## Key Learning

Heavy parallel agent orchestration (7+ simultaneous agents) delivers massive throughput but burns through rate limits fast. Two agents hit rate limits in this session, wasting the context they'd already built. The sweet spot appears to be 3-4 parallel agents maximum, with strategic allocation: Haiku for search/gather, Sonnet for analysis, Opus for synthesis and code.

Always check prerequisites (API keys, auth tokens, env vars) BEFORE spawning agents that need them. Three image generation agents failed because GEMINI_API_KEY wasn't set — a 2-second check would have saved 5 minutes of wasted compute.

## The Pattern

```
Before spawning agent:
1. Check: Does it need API keys? → verify they exist
2. Check: Does it need auth? → verify logged in
3. Check: Will it compete for rate limits? → stagger or reduce count
4. Allocate: Search → Haiku, Analysis → Sonnet, Code → Opus
```

## Why This Matters

Parallel agents are the Oracle's superpower but they need resource management. Without it, you get chaotic bursts of activity followed by rate-limited silence. With it, you get sustained, strategic throughput.

## Tags

`agents`, `orchestration`, `rate-limits`, `parallel`, `prerequisites`, `resource-management`
