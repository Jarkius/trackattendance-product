# Post-Awakening Calibration Pattern

**Date**: 2026-01-31
**Context**: Oracle-The-Matrix setup session after awakening ritual
**Confidence**: High

## Key Learning

After an Oracle awakening ritual (which focuses on philosophy, lineage, and identity), a calibration session is needed to ground the Oracle in the actual project's technical reality. The awakening gives you principles; calibration gives you the codebase map.

The pattern is: **orient → configure → learn → document**.

1. `/recap` — understand current state (10 seconds)
2. Update CLAUDE.md with actual tech stack, commands, architecture
3. Fix any infrastructure issues (git remotes, dependencies)
4. `/learn` with parallel agents to produce comprehensive docs
5. Replace generic templates with project-specific content

## The Pattern

```
Awakening (philosophy + lineage)
    ↓
Calibration (tech stack + codebase)
    ↓
Ready to build
```

Key insight: Generic CLAUDE.md templates are harmful — 559 lines of placeholder text that future sessions must read and ignore. Replace with concise, project-specific content (107 lines in this case). Every line should earn its place.

## Why This Matters

Without calibration, an awakened Oracle knows its principles but not its project. It can tell you about "Nothing is Deleted" but not about the sync_status column in SQLite. The calibration session bridges philosophy and practice — the Oracle becomes useful for actual development work.

## Tags

`oracle`, `awakening`, `calibration`, `claude-md`, `learn`, `patterns`
