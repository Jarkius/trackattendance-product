# Handoff: Skills Arsenal Test Plan

**Date**: 2026-03-14 20:23

## What We Did
- Fixed Starship terminal prompt (add_newline)
- Updated `/gemini` skill with full MQTT + CDP browser control docs
- Pulled maw-js (26 commits), rebuilt fleet dashboard
- Registered oracle-v2 as global MCP server (22 tools)
- Discovered awesome-openclaw-skills (908+ community skills)
- Security audited 50+ skills across 15+ parallel Haiku agents — all SAFE
- Installed 31 new skills globally (67 total)
- Built Proactive Skills Playbook into CLAUDE.md
- Saved browser proxy memory + proactive skills feedback

## Pending
- [ ] Restart Claude Code to load oracle-v2 MCP + new skills
- [ ] Push 8+ pending commits to remote
- [ ] Set up API keys for skills that need them

## Next Session: Skills Demo & Test Plan

**Goal**: Prove skills are actually used and useful. Run 6 quick demos:

### Test 1: `/theme-gen` — Generate TrackAttendance color system
```
Use TrackAttendance brand colors → generate full shade scale (50-950) + semantic tokens
Proves: design pipeline works
```

### Test 2: `/x-trends` — Check Thailand trending topics
```
Fetch current X/Twitter trends for Thailand
Proves: social intelligence works
```

### Test 3: `/summarize` — Summarize the TrackAttendance landing page
```
Summarize landing/index.html or the live URL
Proves: content analysis works
```

### Test 4: `/a11y-checker` — Scan landing page for accessibility issues
```
Run accessibility audit on landing/index.html
Proves: design QA pipeline works
```

### Test 5: `/verify-on-browser` — Check fleet dashboard via CDP
```
Use CDP to read fleet page, verify agents status
Proves: browser control works without forgetting
```

### Test 6: `/agent-orchestrator` — Decompose a real task
```
Give it: "Prepare TrackAttendance for first B2B demo"
Let it decompose into sub-tasks and show the plan
Proves: meta-agent orchestration works
```

### Bonus: Oracle MCP Test
```
After restart, test oracle_search, oracle_learn, oracle_trace
Proves: 22 oracle tools are accessible
```

## Key Files
- `CLAUDE.md` — Updated with Proactive Skills Playbook
- `~/.claude/skills/` — 67 skills (36 Oracle + 31 OpenClaw)
- `~/.claude.json` — oracle-v2 MCP registered globally
- `ψ/learn/sundial-org/awesome-openclaw-skills/` — Learn docs
- `~/.claude/skills/gemini/SKILL.md` — Browser control reference

## API Keys Needed (for full skill activation)
| Skill | Env Var | Where to get |
|-------|---------|-------------|
| figma | `FIGMA_ACCESS_TOKEN` | figma.com/developers |
| ga4-analytics | Google service account JSON | console.cloud.google.com |
| x-api | `X_API_KEY`, `X_API_SECRET` + OAuth | developer.x.com |
| telegram-bot | `TELEGRAM_BOT_TOKEN` | @BotFather on Telegram |
| veo | `GEMINI_API_KEY` | ai.google.dev |
| openai-image-gen | `OPENAI_API_KEY` | platform.openai.com |
| cloudflare | `CF_API_TOKEN` | dash.cloudflare.com/profile/api-tokens |
| resend | `RESEND_API_KEY` | resend.com |
| context7 | `CONTEXT7_API_KEY` | context7.com |
