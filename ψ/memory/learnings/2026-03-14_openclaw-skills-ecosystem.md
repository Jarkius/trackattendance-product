# OpenClaw Skills Ecosystem: Parallel Audit + Proactive Integration Pattern

**Date**: 2026-03-14
**Context**: Discovered and integrated 31 skills from awesome-openclaw-skills into Oracle
**Confidence**: High

## Key Learning

Community skill ecosystems (like awesome-openclaw-skills with 908+ skills) are gold mines for capability expansion, but they require two critical gates: **security auditing** and **proactive wiring**.

Security auditing at scale works best with parallel Haiku agents — each checks 2-4 skills for trojans, data exfiltration, credential theft, eval/exec, and suspicious network calls. Most community skills are documentation-only wrappers (SKILL.md files) or thin API clients calling official endpoints, making them inherently safe. In our audit of 50+ skills, zero were malicious.

The harder problem is proactive wiring. Skills installed to `~/.claude/skills/` are loaded by Claude Code on startup, but they only activate on keyword triggers in their description field. Without a proactive playbook mapping situations → skills, agents won't know when to reach for them. The solution is embedding a "Proactive Skills Playbook" directly in CLAUDE.md — it's loaded every session and maps concrete situations (building UI, deploying, researching, creating content) to specific skill invocations.

## The Pattern

```
1. Discover ecosystem → ghq get + /learn
2. Parallel audit (6 Haiku agents) → SAFE/SUSPICIOUS verdict
3. Install via sundial-hub → --claude --global --yes
4. Wire proactively → CLAUDE.md playbook section
5. Test in action → verify skills actually fire
```

Install command: `npx sundial-hub add --claude --global --yes /path/to/skill`
Skills land as symlinks: `~/.claude/skills/name → ~/.agents/skills/name`

## Why This Matters

An Oracle with 67 skills that knows when to use each one is fundamentally different from an Oracle with 36 skills waiting to be asked. The proactive playbook transforms a tool collection into an autonomous capability layer. Combined with compound-engineering (nightly learning) and self-improvement (error capture), the system evolves itself.

## Tags

`skills`, `openclaw`, `security-audit`, `parallel-agents`, `proactive`, `oracle-evolution`, `sundial-hub`
