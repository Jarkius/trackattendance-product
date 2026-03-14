# MAW Multi-Agent Orchestration: Parallel Sprint Execution

**Date**: 2026-03-14
**Context**: TrackAttendance Sprint 1 — 3 parallel Claude agents via MAW.js
**Confidence**: High

## Key Learning

MAW (Multi-Agent Workflow) enables 3+ Claude agents working simultaneously on different files in the same repo. Sprint 1 tasks that would take 30+ minutes sequentially completed in ~2 minutes. But agents exhaust context (~150K tokens) after multiple rounds of tasks and need fresh sessions.

The optimal pattern:
1. Give each agent a **separate scope** (different files/directories)
2. Tasks should be **self-contained** (read → modify → done)
3. Check results BETWEEN rounds (don't chain 5 tasks blindly)
4. Reset agents when context exceeds ~120K tokens

## The Pattern

```bash
# Wake 3 agents
maw wake all

# Dispatch non-overlapping tasks
maw hey ta-api "modify server.ts — add RLS" --force
maw hey ta-frontend "modify main.py — add license parsing" --force
maw hey ta-landing "create landing/index.html" --force

# Check results
maw peek ta-api
maw peek ta-frontend
maw peek ta-landing

# Dispatch next round
maw hey ta-api "now write tests" --force
```

## Why This Matters

Solo developer velocity multiplied by 3x. The hard part isn't the coding — it's orchestrating the agents with clear, non-overlapping instructions. MAW's `hey --force` and `peek` commands make this manageable from a single terminal.

## Tags

`maw`, `multi-agent`, `orchestration`, `parallel`, `sprint`, `velocity`
